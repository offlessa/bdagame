export type AttributeKey = 'flow' | 'tecnica' | 'frieza' | 'inteligencia' | 'presenca' | 'punchline';

export type Archetype = 'ATACANTE' | 'DOMINANTE' | 'DINAMICO' | 'TECNICO' | 'CONTROLADOR';

export interface Attributes {
  flow: number;
  tecnica: number;
  frieza: number;
  inteligencia: number;
  presenca: number;
  punchline: number;
}

export type FatalityTrigger =
  | { type: 'attacking'; boost: Partial<Attributes> }
  | { type: 'defending'; boost: Partial<Attributes> }
  | { type: 'responding'; boost: Partial<Attributes> }
  | { type: 'if_attribute_chosen'; attribute: AttributeKey; boost: Partial<Attributes> }
  | { type: 'after_opponent_declares'; penalize_opponent_attr: true; penalty: number }
  | { type: 'choose_declared_attr'; boost: number }
  | { type: 'flat'; boost: Partial<Attributes> };

export interface FatalityExtra {
  type: 'add_barra' | 'add_barra_per_won_attr' | 'add_hype' | 'add_barra_if_win_by' | 'draw_beats';
  value?: number;
  threshold?: number;
}

export interface Fatality {
  cost: number;
  triggers: FatalityTrigger[];
  extra?: FatalityExtra;
}

export interface MCCard {
  id: string;
  name: string;
  country: string;
  state: string;
  archetype: Archetype;
  hype: 1 | 2 | 3;
  isLegend?: boolean;
  isMVP?: boolean;
  attributes: Attributes;
  fatality: Fatality;
  imageUrl?: string;
}

export interface BeatEffect {
  attribute: AttributeKey;
  modifier: number;
}

export interface BeatCard {
  id: string;
  name: string;
  description: string;
  hype: 1 | 2 | 3;
  effects: BeatEffect[];
}

export type MomentTarget = 'attacker' | 'defender' | 'low_hype' | 'high_hype' | 'both' | 'winner_volta';

export interface MomentEffect {
  target: MomentTarget;
  attribute?: AttributeKey;
  modifier?: number;
  description: string;
}

export interface MomentCard {
  id: string;
  name: string;
  description: string;
  effect: MomentEffect;
  imageUrl?: string;
}

export type RoundPhase =
  | 'waiting_beat'
  | 'attacker_choose_attrs'
  | 'defender_choose_attrs'
  | 'reveal_mcs'
  | 'fatality_window'
  | 'reveal_moment'
  | 'calculating'
  | 'round_over';

export type BattlePhase = 'preparation' | 'round1' | 'round2' | 'round3' | 'battle_over';

export interface PlayerState {
  id: string;
  hand: MCCard[];
  usedMCIndex: number;
  barras: number;
  roundsWon: number;
  isReady: boolean;
}

export interface RoundState {
  roundNumber: 1 | 2 | 3;
  attackerId: string;
  defenderId: string;
  currentBeat: BeatCard | null;
  currentMoment: MomentCard | null;
  attackerChosenAttrs: AttributeKey[];
  defenderChosenAttrs: AttributeKey[];
  attackerFatalityActivated: boolean;
  defenderFatalityActivated: boolean;
  phase: RoundPhase;
  volta?: 1 | 2;
  volta1Result?: { winnerId: string | null };
}

export interface BattleState {
  id: string;
  phase: BattlePhase;
  players: [PlayerState, PlayerState];
  currentRound: RoundState | null;
  firstAttackerId: string;
  round3UsedAttrs: Record<string, AttributeKey[]>;
  winner: string | null;
  log: GameEvent[];
}

export interface RoundResult {
  winnerId: string | null;
  attackerScore: number;
  defenderScore: number;
  tiebreaker?: 'entrosamento' | 'hype' | 'initiative';
  barraGains: Record<string, number>;
  bonusBarra: boolean;
}

export type GameEvent =
  | { type: 'BEAT_DRAWN'; beatId: string; by: string }
  | { type: 'ATTRS_CHOSEN'; playerId: string; attrs: AttributeKey[] }
  | { type: 'MC_REVEALED'; playerId: string; mcId: string }
  | { type: 'FATALITY_ACTIVATED'; playerId: string; mcId: string }
  | { type: 'MOMENT_REVEALED'; momentId: string; by: string }
  | { type: 'ROUND_RESULT'; result: RoundResult; roundNumber: number }
  | { type: 'MOMENT_SWAPPED'; by: string; newMomentId: string }
  | { type: 'BATTLE_OVER'; winnerId: string };
