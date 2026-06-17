import { MCCard, BeatCard, MomentCard, AttributeKey, Attributes, RoundResult } from './types';
import { calcEntrosamento } from './entrosamento';
import { calcBarraGains } from './barras';

export interface ResolveRoundParams {
  attackerMC: MCCard;
  defenderMC: MCCard;
  attackerTrio: MCCard[];
  defenderTrio: MCCard[];
  attackerAttrs: AttributeKey[];
  defenderAttrs: AttributeKey[];
  beat: BeatCard;
  moment: MomentCard;
  attackerEffectiveAttrs: Attributes;
  defenderEffectiveAttrs: Attributes;
  firstAttackerId: string;
  attackerId: string;
}

function applyBeatEffects(attrs: Attributes, beat: BeatCard): Attributes {
  const result = { ...attrs };
  for (const effect of beat.effects) {
    result[effect.attribute] = Math.max(0, result[effect.attribute] + effect.modifier);
  }
  return result;
}

function applyMomentEffects(
  attackerAttrs: Attributes,
  defenderAttrs: Attributes,
  attackerMC: MCCard,
  defenderMC: MCCard,
  moment: MomentCard,
): { attacker: Attributes; defender: Attributes } {
  const { effect } = moment;
  let a = { ...attackerAttrs };
  let d = { ...defenderAttrs };

  const applyToMC = (mc: MCCard, attrs: Attributes): Attributes => {
    if (!effect.attribute || effect.modifier === undefined) return attrs;
    const newVal = Math.max(0, attrs[effect.attribute] + effect.modifier);
    return { ...attrs, [effect.attribute]: newVal };
  };

  switch (effect.target) {
    case 'attacker':
      a = applyToMC(attackerMC, a);
      break;
    case 'defender':
      d = applyToMC(defenderMC, d);
      break;
    case 'both':
      a = applyToMC(attackerMC, a);
      d = applyToMC(defenderMC, d);
      break;
    case 'low_hype':
      if (attackerMC.hype <= 2) a = applyToMC(attackerMC, a);
      if (defenderMC.hype <= 2) d = applyToMC(defenderMC, d);
      break;
    case 'high_hype':
      if (attackerMC.hype === 3) a = applyToMC(attackerMC, a);
      if (defenderMC.hype === 3) d = applyToMC(defenderMC, d);
      break;
  }

  return { attacker: a, defender: d };
}

export function resolveRound(params: ResolveRoundParams): RoundResult {
  const {
    attackerMC, defenderMC,
    attackerTrio, defenderTrio,
    attackerAttrs, defenderAttrs,
    beat, moment,
    attackerEffectiveAttrs, defenderEffectiveAttrs,
    firstAttackerId, attackerId,
  } = params;

  // Apply Beat
  let aAttrs = applyBeatEffects(attackerEffectiveAttrs, beat);
  let dAttrs = applyBeatEffects(defenderEffectiveAttrs, beat);

  // Apply Moment
  const afterMoment = applyMomentEffects(aAttrs, dAttrs, attackerMC, defenderMC, moment);
  aAttrs = afterMoment.attacker;
  dAttrs = afterMoment.defender;

  // Sum chosen attributes
  const attackerScore = attackerAttrs.reduce((sum, key) => sum + aAttrs[key], 0);
  const defenderScore = defenderAttrs.reduce((sum, key) => sum + dAttrs[key], 0);

  let winnerId: string | null = null;
  let tiebreaker: RoundResult['tiebreaker'];

  if (attackerScore !== defenderScore) {
    winnerId = attackerScore > defenderScore ? attackerMC.id : defenderMC.id;
  } else {
    // Tiebreaker 1: Entrosamento
    const aEntros = calcEntrosamento(attackerTrio);
    const dEntros = calcEntrosamento(defenderTrio);
    if (aEntros !== dEntros) {
      winnerId = aEntros > dEntros ? attackerMC.id : defenderMC.id;
      tiebreaker = 'entrosamento';
    } else {
      // Tiebreaker 2: Hype total do trio
      const aHype = attackerTrio.reduce((s, mc) => s + mc.hype, 0);
      const dHype = defenderTrio.reduce((s, mc) => s + mc.hype, 0);
      if (aHype !== dHype) {
        winnerId = aHype > dHype ? attackerMC.id : defenderMC.id;
        tiebreaker = 'hype';
      } else {
        // Tiebreaker 3: Who started attacking
        winnerId = firstAttackerId === attackerId ? attackerMC.id : defenderMC.id;
        tiebreaker = 'initiative';
      }
    }
  }

  const scoreDiff = Math.abs(attackerScore - defenderScore);
  const attackerWon = winnerId === attackerMC.id;
  const barraGainsRaw = calcBarraGains(
    attackerAttrs.map((k) => ({ key: k, value: aAttrs[k] })),
    defenderAttrs.map((k) => ({ key: k, value: dAttrs[k] })),
    attackerWon,
    scoreDiff,
  );

  return {
    winnerId,
    attackerScore,
    defenderScore,
    tiebreaker,
    barraGains: {
      [attackerMC.id]: barraGainsRaw.attacker,
      [defenderMC.id]: barraGainsRaw.defender,
    },
    bonusBarra: scoreDiff >= 3,
  };
}
