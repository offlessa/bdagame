import {
  BattleState, PlayerState, RoundState, MCCard, BeatCard, MomentCard,
  AttributeKey, GameEvent, BattlePhase,
} from './types';
import { resolveRound } from './round';
import { applyFatality } from './fatality';
import { clampBarras } from './barras';

function makePlayer(id: string, hand: MCCard[]): PlayerState {
  return { id, hand, usedMCIndex: 0, barras: 0, roundsWon: 0, isReady: false };
}

export function createBattle(
  battleId: string,
  player1Id: string,
  player2Id: string,
  player1Hand: MCCard[],
  player2Hand: MCCard[],
  firstAttackerId: string,
): BattleState {
  return {
    id: battleId,
    phase: 'preparation',
    players: [makePlayer(player1Id, player1Hand), makePlayer(player2Id, player2Hand)],
    currentRound: null,
    firstAttackerId,
    round3UsedAttrs: { [player1Id]: [], [player2Id]: [] },
    winner: null,
    log: [],
  };
}

function getPlayer(state: BattleState, id: string): PlayerState {
  const p = state.players.find((p) => p.id === id);
  if (!p) throw new Error(`Player ${id} not found`);
  return p;
}

function getOpponent(state: BattleState, id: string): PlayerState {
  const p = state.players.find((p) => p.id !== id);
  if (!p) throw new Error('Opponent not found');
  return p;
}

function addLog(state: BattleState, event: GameEvent): void {
  state.log.push(event);
}

export function startRound(state: BattleState, roundNumber: 1 | 2 | 3): BattleState {
  const s = structuredClone(state);
  const attackerId = roundNumber === 1
    ? s.firstAttackerId
    : roundNumber === 2
      ? getOpponent(s, s.firstAttackerId).id
      : s.firstAttackerId; // Round 3: reset to first attacker

  s.currentRound = {
    roundNumber,
    attackerId,
    defenderId: getOpponent(s, attackerId).id,
    currentBeat: null,
    currentMoment: null,
    attackerChosenAttrs: [],
    defenderChosenAttrs: [],
    attackerFatalityActivated: false,
    defenderFatalityActivated: false,
    phase: 'waiting_beat',
  };

  s.phase = `round${roundNumber}` as BattlePhase;
  return s;
}

export function setBeat(state: BattleState, beat: BeatCard): BattleState {
  const s = structuredClone(state);
  const round = s.currentRound!;
  round.currentBeat = beat;
  round.phase = 'attacker_choose_attrs';
  addLog(s, { type: 'BEAT_DRAWN', beatId: beat.id, by: round.attackerId });
  return s;
}

export function chooseAttrs(
  state: BattleState,
  playerId: string,
  attrs: AttributeKey[],
): BattleState {
  const s = structuredClone(state);
  const round = s.currentRound!;
  const isAttacker = playerId === round.attackerId;

  if (isAttacker) {
    round.attackerChosenAttrs = attrs;
    round.phase = 'defender_choose_attrs';
  } else {
    round.defenderChosenAttrs = attrs;
    round.phase = 'reveal_mcs';
  }

  addLog(s, { type: 'ATTRS_CHOSEN', playerId, attrs });
  return s;
}

export function revealMCs(state: BattleState): BattleState {
  const s = structuredClone(state);
  const round = s.currentRound!;
  const attacker = getPlayer(s, round.attackerId);
  const defender = getPlayer(s, round.defenderId);

  round.phase = 'fatality_window';
  addLog(s, { type: 'MC_REVEALED', playerId: attacker.id, mcId: attacker.hand[attacker.usedMCIndex].id });
  addLog(s, { type: 'MC_REVEALED', playerId: defender.id, mcId: defender.hand[defender.usedMCIndex].id });
  return s;
}

export function activateFatality(state: BattleState, playerId: string): BattleState {
  const s = structuredClone(state);
  const round = s.currentRound!;
  const player = getPlayer(s, playerId);

  if (player.barras < 3) throw new Error('Insufficient barras for Fatality (need 3)');

  player.barras -= 3;

  if (playerId === round.attackerId) round.attackerFatalityActivated = true;
  else round.defenderFatalityActivated = true;

  addLog(s, { type: 'FATALITY_ACTIVATED', playerId, mcId: player.hand[player.usedMCIndex].id });
  return s;
}

export function revealMoment(state: BattleState, moment: MomentCard): BattleState {
  const s = structuredClone(state);
  const round = s.currentRound!;
  round.currentMoment = moment;
  round.phase = 'calculating';
  addLog(s, { type: 'MOMENT_REVEALED', momentId: moment.id, by: round.defenderId });
  return s;
}

export function swapMoment(state: BattleState, playerId: string, newMoment: MomentCard): BattleState {
  const s = structuredClone(state);
  const player = getPlayer(s, playerId);

  if (player.barras < 2) throw new Error('Insufficient barras to swap Moment (need 2)');

  player.barras -= 2;
  s.currentRound!.currentMoment = newMoment;
  addLog(s, { type: 'MOMENT_SWAPPED', by: playerId, newMomentId: newMoment.id });
  return s;
}

export function calculateRound(state: BattleState): BattleState {
  const s = structuredClone(state);
  const round = s.currentRound!;
  const attacker = getPlayer(s, round.attackerId);
  const defender = getPlayer(s, round.defenderId);
  const attackerMC = attacker.hand[attacker.usedMCIndex];
  const defenderMC = defender.hand[defender.usedMCIndex];

  // Apply Fatality effects to effective attributes
  let aEffective = { ...attackerMC.attributes };
  let dEffective = { ...defenderMC.attributes };

  if (round.attackerFatalityActivated) {
    const { attrs, opponentPenalty } = applyFatality(attackerMC, aEffective, {
      isAttacking: true,
      chosenAttrs: round.attackerChosenAttrs,
      opponentChosenAttrs: round.defenderChosenAttrs,
    });
    aEffective = attrs;
    if (opponentPenalty) {
      dEffective = { ...dEffective, [opponentPenalty.attribute]: Math.max(0, dEffective[opponentPenalty.attribute] - opponentPenalty.value) };
    }
  }

  if (round.defenderFatalityActivated) {
    const { attrs } = applyFatality(defenderMC, dEffective, {
      isAttacking: false,
      chosenAttrs: round.defenderChosenAttrs,
      opponentChosenAttrs: round.attackerChosenAttrs,
    });
    dEffective = attrs;
  }

  const result = resolveRound({
    attackerMC,
    defenderMC,
    attackerTrio: attacker.hand,
    defenderTrio: defender.hand,
    attackerAttrs: round.attackerChosenAttrs,
    defenderAttrs: round.defenderChosenAttrs,
    beat: round.currentBeat!,
    moment: round.currentMoment!,
    attackerEffectiveAttrs: aEffective,
    defenderEffectiveAttrs: dEffective,
    firstAttackerId: s.firstAttackerId,
    attackerId: round.attackerId,
  });

  // Apply barra gains
  const attackerBarraGain = result.barraGains[attackerMC.id] ?? 0;
  const defenderBarraGain = result.barraGains[defenderMC.id] ?? 0;
  attacker.barras = clampBarras(attacker.barras, attackerBarraGain);
  defender.barras = clampBarras(defender.barras, defenderBarraGain);

  // Apply Fatality extras
  if (round.attackerFatalityActivated) applyFatalityExtra(s, attacker, attackerMC, result.winnerId === attacker.id, result);
  if (round.defenderFatalityActivated) applyFatalityExtra(s, defender, defenderMC, result.winnerId === defender.id, result);

  // Track round winner
  if (result.winnerId) {
    const winningPlayer = s.players.find((p) => p.hand.some((mc) => mc.id === result.winnerId))!;
    winningPlayer.roundsWon++;
  }

  // Advance MC index
  attacker.usedMCIndex++;
  defender.usedMCIndex++;

  // Track used attrs for round 3
  s.round3UsedAttrs[attacker.id].push(...round.attackerChosenAttrs);
  s.round3UsedAttrs[defender.id].push(...round.defenderChosenAttrs);

  round.phase = 'round_over';
  addLog(s, { type: 'ROUND_RESULT', result, roundNumber: round.roundNumber });

  // Determine if battle is over
  const [p1, p2] = s.players;
  if (p1.roundsWon >= 2 || p2.roundsWon >= 2) {
    const battleWinner = p1.roundsWon >= 2 ? p1 : p2;
    s.winner = battleWinner.id;
    s.phase = 'battle_over';
    addLog(s, { type: 'BATTLE_OVER', winnerId: battleWinner.id });
  }

  return s;
}

function applyFatalityExtra(
  state: BattleState,
  player: PlayerState,
  mc: MCCard,
  won: boolean,
  result: { attackerScore: number; defenderScore: number },
): void {
  const extra = mc.fatality.extra;
  if (!extra) return;

  switch (extra.type) {
    case 'add_barra':
      if (won) player.barras = clampBarras(player.barras, extra.value ?? 1);
      break;
    case 'add_barra_per_won_attr':
      // Already handled in round calculation — no-op here
      break;
    case 'add_hype':
      mc.hype = Math.min(3, mc.hype + (extra.value ?? 1)) as 1 | 2 | 3;
      break;
    case 'add_barra_if_win_by': {
      const diff = Math.abs(result.attackerScore - result.defenderScore);
      if (won && diff >= (extra.threshold ?? 2)) player.barras = clampBarras(player.barras, extra.value ?? 1);
      break;
    }
    case 'draw_beats':
      // Frontend handles presenting the extra beat choice
      break;
  }
}

export function getBattleWinner(state: BattleState): string | null {
  const [p1, p2] = state.players;
  if (p1.roundsWon > p2.roundsWon) return p1.id;
  if (p2.roundsWon > p1.roundsWon) return p2.id;
  return null;
}

export function getAvailableAttrsForRound3(state: BattleState, playerId: string): AttributeKey[] {
  const allAttrs: AttributeKey[] = ['flow', 'tecnica', 'frieza', 'inteligencia', 'presenca', 'punchline'];
  const used = state.round3UsedAttrs[playerId] ?? [];
  return allAttrs.filter((a) => !used.includes(a));
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
