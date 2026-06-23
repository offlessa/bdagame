import { create } from 'zustand';
import {
  BattleSession, NPC, Beat, BattlePhase,
  RhymeQuality, GuitarNote, RoundScore,
} from '../types/game';
import { generateOptions } from '../data/rhymes';

const QUALITY_BASE: Record<RhymeQuality, number> = {
  fraca: 8, ok: 16, boa: 26, perfeita: 40,
};

const TIMER_SECONDS = 8;
const NOTES_COUNT = 16;
const LANES = 4;

// Calcula score do player para um round de resposta rápida
function calcPlayerScore(
  quality: RhymeQuality,
  attrValue: number,
  beatBonus: number,
): number {
  const base = QUALITY_BASE[quality];
  const attrMult = (attrValue + beatBonus) / 10;
  return Math.round(base * attrMult);
}

// Calcula score do NPC automaticamente
function calcNpcScore(
  attrs: Record<string, number>,
  primaryAttr: string,
  beatBonus: number,
  difficulty: 1 | 2 | 3,
): { score: number; quality: RhymeQuality } {
  const attrVal = attrs[primaryAttr] ?? 5;
  const total = attrVal + beatBonus;

  // Dificuldade influencia qual qualidade o NPC escolhe
  const roll = Math.random();
  let quality: RhymeQuality;
  if (difficulty === 1) {
    quality = roll < 0.4 ? 'fraca' : roll < 0.75 ? 'ok' : roll < 0.95 ? 'boa' : 'perfeita';
  } else if (difficulty === 2) {
    quality = roll < 0.15 ? 'fraca' : roll < 0.4 ? 'ok' : roll < 0.75 ? 'boa' : 'perfeita';
  } else {
    quality = roll < 0.05 ? 'fraca' : roll < 0.2 ? 'ok' : roll < 0.55 ? 'boa' : 'perfeita';
  }

  return { score: Math.round(QUALITY_BASE[quality] * (total / 10)), quality };
}

// Gera notas para o round 3 (Guitar Hero)
function generateNotes(): GuitarNote[] {
  return Array.from({ length: NOTES_COUNT }, (_, i) => ({
    id: `note-${i}`,
    lane: (i % LANES) as 0 | 1 | 2 | 3,
    beatIndex: i,
    hit: null,
  }));
}

interface BattleStore {
  session: BattleSession | null;
  startBattle: (npc: NPC, beat: Beat) => void;
  playerChoose: (optionId: string, playerAttrs: Record<string, number>) => void;
  tickTimer: () => void;
  advancePhase: () => void;
  hitNote: (noteId: string) => void;
  missNote: (noteId: string) => void;
  finishRound3: () => void;
  endBattle: () => void;
  clear: () => void;
}

export const useBattleStore = create<BattleStore>((set, get) => ({
  session: null,

  startBattle(npc, beat) {
    const primaryAttr = beat.primaryAttr;
    set({
      session: {
        npc,
        beat,
        phase: 'intro',
        round1: null,
        round2: null,
        round3: null,
        currentOptions: generateOptions(primaryAttr),
        timer: TIMER_SECONDS,
        winner: null,
      },
    });
  },

  playerChoose(optionId, playerAttrs) {
    const s = get().session;
    if (!s) return;

    const option = s.currentOptions.find(o => o.id === optionId);
    if (!option) return;

    const beatBonus = s.beat.attrBonus[option.primaryAttr] ?? 0;
    const playerScore = calcPlayerScore(option.quality, playerAttrs[option.primaryAttr] ?? 5, beatBonus);
    const { score: npcScore, quality: npcQuality } = calcNpcScore(
      s.npc.attributes as any,
      option.primaryAttr,
      beatBonus,
      s.npc.difficulty,
    );

    const roundData: RoundScore = {
      playerScore,
      npcScore,
      playerQuality: option.quality,
      npcQuality,
      playerChoiceId: optionId,
    };

    const isRound1 = s.phase === 'r1_player';
    set({
      session: {
        ...s,
        phase: isRound1 ? 'r1_npc' : 'r2_npc',
        round1: isRound1 ? roundData : s.round1,
        round2: !isRound1 ? roundData : s.round2,
      },
    });
  },

  tickTimer() {
    const s = get().session;
    if (!s || s.timer <= 0) return;
    const newTimer = s.timer - 1;
    if (newTimer <= 0) {
      // Timer esgotou: pega a opção "ok" automaticamente (penalidade leve)
      const fallback = s.currentOptions.find(o => o.quality === 'ok') ?? s.currentOptions[0];
      get().playerChoose(fallback.id, {});
    } else {
      set({ session: { ...s, timer: newTimer } });
    }
  },

  advancePhase() {
    const s = get().session;
    if (!s) return;

    const nextMap: Partial<Record<BattlePhase, BattlePhase>> = {
      intro: 'r1_player',
      r1_npc: 'r1_result',
      r1_result: 'r2_player',
      r2_npc: 'r2_result',
      r2_result: 'r3_guitar',
    };

    const next = nextMap[s.phase];
    if (!next) return;

    const newOptions = next === 'r2_player'
      ? generateOptions(s.beat.primaryAttr)
      : s.currentOptions;

    const round3Init = next === 'r3_guitar'
      ? { notes: generateNotes(), playerScore: 0, npcScore: 0, streak: 0, maxStreak: 0, finished: false }
      : s.round3;

    set({
      session: {
        ...s,
        phase: next,
        currentOptions: newOptions,
        timer: TIMER_SECONDS,
        round3: round3Init,
      },
    });
  },

  hitNote(noteId) {
    const s = get().session;
    if (!s?.round3) return;

    const notes = s.round3.notes.map(n => n.id === noteId ? { ...n, hit: true as const } : n);
    const streak = s.round3.streak + 1;
    const multiplier = Math.min(4, 1 + Math.floor(streak / 4));
    const playerScore = s.round3.playerScore + 10 * multiplier;

    set({
      session: {
        ...s,
        round3: { ...s.round3, notes, streak, maxStreak: Math.max(s.round3.maxStreak, streak), playerScore },
      },
    });
  },

  missNote(noteId) {
    const s = get().session;
    if (!s?.round3) return;

    const notes = s.round3.notes.map(n => n.id === noteId ? { ...n, hit: false as const } : n);
    set({ session: { ...s, round3: { ...s.round3, notes, streak: 0 } } });
  },

  finishRound3() {
    const s = get().session;
    if (!s?.round3) return;

    // NPC score no round 3: baseado nos atributos de flow/tecnica e dificuldade
    const npcFlow = (s.npc.attributes.flow + s.npc.attributes.tecnica) / 2;
    const diffMult = s.npc.difficulty;
    const npcScore = Math.round(npcFlow * 8 * diffMult);

    const r3 = { ...s.round3, npcScore, finished: true };

    const p1 = s.round1?.playerScore ?? 0;
    const p2 = s.round2?.playerScore ?? 0;
    const p3 = r3.playerScore;
    const n1 = s.round1?.npcScore ?? 0;
    const n2 = s.round2?.npcScore ?? 0;
    const n3 = npcScore;

    const totalPlayer = p1 + p2 + p3;
    const totalNpc = n1 + n2 + n3;
    const winner: BattleSession['winner'] =
      totalPlayer > totalNpc ? 'player' : totalPlayer < totalNpc ? 'npc' : 'draw';

    set({ session: { ...s, round3: r3, phase: 'battle_result', winner } });
  },

  endBattle() {
    set({ session: null });
  },

  clear() {
    set({ session: null });
  },
}));

export { TIMER_SECONDS, QUALITY_BASE };
