export type AttributeKey = 'flow' | 'tecnica' | 'frieza' | 'inteligencia' | 'presenca' | 'punchline';

export interface Attributes {
  flow: number;
  tecnica: number;
  frieza: number;
  inteligencia: number;
  presenca: number;
  punchline: number;
}

export type RhymeQuality = 'fraca' | 'ok' | 'boa' | 'perfeita';

export interface RhymeOption {
  id: string;
  text: string;
  quality: RhymeQuality;
  primaryAttr: AttributeKey;
}

export type Personality = 'chill' | 'arrogante' | 'timido' | 'agitado' | 'misterioso';

export interface NPC {
  id: string;
  name: string;
  nickname: string;
  battleName: string;
  emoji: string;
  personality: Personality;
  friendliness: number;       // 1–10: quanto tempo leva pra virar amigo (1=fácil, 10=difícil)
  attributes: Attributes;
  preferredBeats: string[];   // IDs dos beats onde levam bônus
  difficulty: 1 | 2 | 3;
  location: string;           // ID do mapa
  inscricao: string;
  premiacao: string;
  mcsConfirmados: string[];
  formato: string;
  catchphrase: string;
  greetings: string[];
  winLines: string[];
  lossLines: string[];
}

export interface Beat {
  id: string;
  name: string;
  emoji: string;
  primaryAttr: AttributeKey;
  attrBonus: Partial<Attributes>;
}

// ── Battle ──────────────────────────────────────────────────────────────────

export type BattlePhase =
  | 'intro'
  | 'r1_player' | 'r1_npc' | 'r1_result'
  | 'r2_player' | 'r2_npc' | 'r2_result'
  | 'r3_guitar'
  | 'battle_result';

export interface RoundScore {
  playerScore: number;
  npcScore: number;
  playerQuality?: RhymeQuality;
  npcQuality?: RhymeQuality;
  playerChoiceId?: string;
}

export interface GuitarNote {
  id: string;
  lane: 0 | 1 | 2 | 3;
  beatIndex: number;
  hit: boolean | null; // null = ainda não chegou, true = acertou, false = errou
}

export interface Round3State {
  notes: GuitarNote[];
  playerScore: number;
  npcScore: number;
  streak: number;
  maxStreak: number;
  finished: boolean;
}

export interface BattleSession {
  npc: NPC;
  beat: Beat;
  phase: BattlePhase;
  round1: RoundScore | null;
  round2: RoundScore | null;
  round3: Round3State | null;
  currentOptions: RhymeOption[];
  timer: number;
  winner: 'player' | 'npc' | 'draw' | null;
}

// ── Career ──────────────────────────────────────────────────────────────────

export type MapTier = 'underground' | 'clube' | 'festival' | 'evento';

export interface GameMap {
  id: string;
  name: string;
  tier: MapTier;
  emoji: string;
  requiredLevel: number;
  requiredHype: number;
  npcIds: string[];
}

export interface CareerState {
  level: number;
  rp: number;
  hype: number;
  attributePoints: number;
  attributes: Attributes;
  currentMapId: string;
  unlockedMapIds: string[];
  defeatedNpcIds: string[];
  friendships: Record<string, number>; // npcId → 0-100
  partners: string[];                  // npcIds que viraram dupla/trio
  trophies: string[];
  leaves: number;                      // "folhinhas" — moeda de coleção
  lastPlayedDate: string | null;       // YYYY-MM-DD — para streak diário
}
