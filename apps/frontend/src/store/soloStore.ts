import { create } from 'zustand';
import {
  MC_CARDS, BEAT_CARDS, MOMENT_CARDS,
  createBattle, startRound, setBeat, chooseAttrs as engineChooseAttrs,
  revealMCs, activateFatality as engineActivateFatality,
  revealMoment as engineRevealMoment, calculateRound,
  getAvailableAttrsForRound3, shuffle,
  BattleState, BeatCard, MomentCard, AttributeKey, RoundResult,
} from '@batalha/game-engine';

export const PLAYER_ID = 'solo-player';
export const AI_ID = 'solo-ai';

const ALL_ATTRS: AttributeKey[] = ['flow', 'tecnica', 'frieza', 'inteligencia', 'presenca', 'punchline'];

function pickAIAttrs(battle: BattleState, count: number): AttributeKey[] {
  const roundNum = battle.currentRound!.roundNumber;
  const pool = roundNum === 3
    ? getAvailableAttrsForRound3(battle, AI_ID)
    : [...ALL_ATTRS];
  return (shuffle(pool) as AttributeKey[]).slice(0, Math.min(count, pool.length));
}

function advanceRound(battle: BattleState) {
  if (battle.phase === 'battle_over') {
    return { battle, soloPhase: 'result' as const, winner: battle.winner };
  }
  const total = battle.players[0].roundsWon + battle.players[1].roundsWon;
  const next = (total + 1) as 1 | 2 | 3;
  return { battle: next <= 3 ? startRound(battle, next) : battle, soloPhase: 'battle' as const, winner: null };
}

export type SoloPhase = 'idle' | 'draft' | 'battle' | 'result';

export interface SoloState {
  soloPhase: SoloPhase;
  selectedMCIds: string[];
  battle: BattleState | null;
  lastBeat: BeatCard | null;
  lastMoment: MomentCard | null;
  winner: string | null;
  aiMessage: string;
  awaitingAI: boolean;
  aiTrigger: number;        // increments every time AI needs to act — component watches this
  lastRoundResult: RoundResult | null;

  startDraft: () => void;
  toggleMC: (id: string) => void;
  confirmDraft: () => void;

  playerDrawBeat: () => void;
  playerChooseAttrs: (attrs: AttributeKey[]) => void;
  playerFatalityActivate: () => void;
  playerFatalitySkip: () => void;
  playerRevealMoment: () => void;
  playerCalculate: () => void;

  runAI: () => void;
  reset: () => void;
}

export const useSoloStore = create<SoloState>((set, get) => {
  // Helper: signal that AI needs to act
  function queueAI(updates: Partial<SoloState> = {}) {
    set({ awaitingAI: true, aiTrigger: get().aiTrigger + 1, ...updates });
  }

  // Helper: signal that it's player's turn
  function playerTurn(updates: Partial<SoloState> = {}) {
    set({ awaitingAI: false, ...updates });
  }

  return {
    soloPhase: 'idle',
    selectedMCIds: [],
    battle: null,
    lastBeat: null,
    lastMoment: null,
    winner: null,
    aiMessage: '',
    awaitingAI: false,
    aiTrigger: 0,
    lastRoundResult: null,

    startDraft: () => set({ soloPhase: 'draft', selectedMCIds: [] }),

    toggleMC: (id) => {
      const { selectedMCIds } = get();
      if (selectedMCIds.includes(id)) {
        set({ selectedMCIds: selectedMCIds.filter((x) => x !== id) });
      } else if (selectedMCIds.length < 3) {
        set({ selectedMCIds: [...selectedMCIds, id] });
      }
    },

    confirmDraft: () => {
      const { selectedMCIds } = get();
      if (selectedMCIds.length !== 3) return;
      const playerHand = selectedMCIds.map((id) => MC_CARDS.find((m) => m.id === id)!);
      const remaining = MC_CARDS.filter((m) => !selectedMCIds.includes(m.id));
      const aiHand = (shuffle([...remaining]) as typeof remaining).slice(0, 3);
      const firstAttacker = Math.random() < 0.5 ? PLAYER_ID : AI_ID;
      let battle = createBattle('solo', PLAYER_ID, AI_ID, playerHand, aiHand, firstAttacker);
      battle = startRound(battle, 1);
      const aiFirst = firstAttacker === AI_ID;
      const base = { battle, soloPhase: 'battle' as const, lastBeat: null, lastMoment: null, winner: null, aiMessage: '', lastRoundResult: null };
      if (aiFirst) queueAI(base); else playerTurn(base);
    },

    playerDrawBeat: () => {
      const { battle } = get();
      if (!battle) return;
      const beat = (shuffle([...BEAT_CARDS]) as BeatCard[])[0];
      playerTurn({ battle: setBeat(battle, beat), lastBeat: beat });
    },

    playerChooseAttrs: (attrs) => {
      const { battle } = get();
      if (!battle) return;
      let b = engineChooseAttrs(battle, PLAYER_ID, attrs);
      if (b.currentRound?.phase === 'reveal_mcs') b = revealMCs(b);
      const phase = b.currentRound?.phase;
      const aiIsDefender = b.currentRound?.defenderId === AI_ID;
      const needsAI = (phase === 'defender_choose_attrs' && aiIsDefender) || phase === 'fatality_window';
      if (needsAI) queueAI({ battle: b });
      else playerTurn({ battle: b });
    },

    playerFatalityActivate: () => {
      const { battle } = get();
      if (!battle) return;
      try {
        queueAI({ battle: engineActivateFatality(battle, PLAYER_ID) });
      } catch { /* barras insuficientes */ }
    },

    playerFatalitySkip: () => queueAI(),

    playerRevealMoment: () => {
      const { battle } = get();
      if (!battle) return;
      const moment = (shuffle([...MOMENT_CARDS]) as MomentCard[])[0];
      const b = engineRevealMoment(battle, moment);
      const aiAttacks = b.currentRound?.attackerId === AI_ID;
      if (aiAttacks) queueAI({ battle: b, lastMoment: moment });
      else playerTurn({ battle: b, lastMoment: moment });
    },

    playerCalculate: () => {
      const { battle } = get();
      if (!battle) return;
      const result = calculateRound(battle);
      const lastLog = [...result.log].reverse().find((e) => e.type === 'ROUND_RESULT');
      const lastRoundResult = lastLog?.type === 'ROUND_RESULT' ? lastLog.result : null;
      const { battle: next, soloPhase, winner } = advanceRound(result);
      const aiStarts = next.currentRound?.attackerId === AI_ID;
      const base = { battle: next, soloPhase, winner, lastBeat: null, lastMoment: null, lastRoundResult };
      if (aiStarts && soloPhase === 'battle') queueAI(base);
      else playerTurn(base);
    },

    runAI: () => {
      const { battle, lastMoment } = get();
      if (!battle?.currentRound) return;
      const round = battle.currentRound;
      const aiAttacks = round.attackerId === AI_ID;
      const aiDefends = round.defenderId === AI_ID;
      const attrCount = round.roundNumber === 3 ? 1 : 2;

      // AI draws beat
      if (aiAttacks && round.phase === 'waiting_beat') {
        const beat = (shuffle([...BEAT_CARDS]) as BeatCard[])[0];
        queueAI({ battle: setBeat(battle, beat), lastBeat: beat, aiMessage: `IA escolheu o beat: "${beat.name}"` });
        return;
      }

      // AI chooses attrs as attacker
      if (aiAttacks && round.phase === 'attacker_choose_attrs') {
        const attrs = pickAIAttrs(battle, attrCount);
        let b = engineChooseAttrs(battle, AI_ID, attrs);
        if (b.currentRound?.phase === 'reveal_mcs') b = revealMCs(b);
        // After AI attacks, player (defender) needs to choose → player's turn
        // Unless phase jumped to fatality_window somehow
        const jumpedToFatality = b.currentRound?.phase === 'fatality_window';
        if (jumpedToFatality) queueAI({ battle: b, aiMessage: `IA atacou com: ${attrs.join(', ')}` });
        else playerTurn({ battle: b, aiMessage: `IA atacou com: ${attrs.join(', ')}` });
        return;
      }

      // AI chooses attrs as defender
      if (aiDefends && round.phase === 'defender_choose_attrs') {
        const attrs = pickAIAttrs(battle, attrCount);
        let b = engineChooseAttrs(battle, AI_ID, attrs);
        if (b.currentRound?.phase === 'reveal_mcs') b = revealMCs(b);
        // Phase is now fatality_window → player needs to decide fatality first
        playerTurn({ battle: b, aiMessage: `IA respondeu com: ${attrs.join(', ')}` });
        return;
      }

      // AI decides fatality (always after player decided)
      if (round.phase === 'fatality_window') {
        const aiPlayer = battle.players.find((p) => p.id === AI_ID)!;
        let b = battle;
        let msg = 'IA passou a janela de Fatality';
        if (aiPlayer.barras >= 3 && Math.random() > 0.6) {
          try { b = engineActivateFatality(b, AI_ID); msg = 'IA ativou FATALITY!'; } catch { /* ok */ }
        }
        if (aiDefends) {
          const moment = (shuffle([...MOMENT_CARDS]) as MomentCard[])[0];
          b = engineRevealMoment(b, moment);
          // Attacker = player → player calculates
          playerTurn({ battle: b, lastMoment: moment, aiMessage: `${msg} — IA revelou: "${moment.name}"` });
        } else {
          // AI attacks → player (defender) reveals moment
          playerTurn({ battle: b, aiMessage: msg });
        }
        return;
      }

      // AI reveals moment (as defender, in calculating phase)
      if (aiDefends && round.phase === 'calculating' && !lastMoment) {
        const moment = (shuffle([...MOMENT_CARDS]) as MomentCard[])[0];
        const b = engineRevealMoment(battle, moment);
        // Attacker = player → player calculates
        playerTurn({ battle: b, lastMoment: moment, aiMessage: `IA revelou: "${moment.name}"` });
        return;
      }

      // AI calculates round (as attacker)
      if (aiAttacks && round.phase === 'calculating' && lastMoment) {
        const result = calculateRound(battle);
        const lastLog = [...result.log].reverse().find((e) => e.type === 'ROUND_RESULT');
        const lastRoundResult = lastLog?.type === 'ROUND_RESULT' ? lastLog.result : null;
        const { battle: next, soloPhase, winner } = advanceRound(result);
        const aiStarts = next.currentRound?.attackerId === AI_ID;
        const base = { battle: next, soloPhase, winner, lastBeat: null, lastMoment: null, lastRoundResult, aiMessage: soloPhase === 'battle' ? 'Próximo round!' : '' };
        if (aiStarts && soloPhase === 'battle') queueAI(base);
        else playerTurn(base);
      }
    },

    reset: () => set({
      soloPhase: 'idle', selectedMCIds: [], battle: null, lastBeat: null,
      lastMoment: null, winner: null, aiMessage: '', awaitingAI: false, aiTrigger: 0, lastRoundResult: null,
    }),
  };
});
