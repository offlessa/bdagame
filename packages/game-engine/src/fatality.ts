import { MCCard, AttributeKey, Attributes, FatalityTrigger } from './types';

export interface FatalityContext {
  isAttacking: boolean;
  chosenAttrs: AttributeKey[];
  opponentChosenAttrs: AttributeKey[];
}

function applyBoost(attrs: Attributes, boost: Partial<Attributes>): Attributes {
  const result = { ...attrs };
  for (const [k, v] of Object.entries(boost)) {
    const key = k as AttributeKey;
    result[key] = Math.min(10, result[key] + (v as number));
  }
  return result;
}

export function applyFatality(
  mc: MCCard,
  baseAttrs: Attributes,
  ctx: FatalityContext,
): { attrs: Attributes; opponentPenalty?: { attribute: AttributeKey; value: number } } {
  let attrs = { ...baseAttrs };
  let opponentPenalty: { attribute: AttributeKey; value: number } | undefined;

  for (const trigger of mc.fatality.triggers) {
    attrs = resolveTrigger(trigger, attrs, ctx, mc);

    if (trigger.type === 'after_opponent_declares') {
      // Caller must supply which opponent attr to penalize — placeholder key
      opponentPenalty = { attribute: ctx.opponentChosenAttrs[0], value: trigger.penalty };
    }
  }

  return { attrs, opponentPenalty };
}

function resolveTrigger(
  trigger: FatalityTrigger,
  attrs: Attributes,
  ctx: FatalityContext,
  mc: MCCard,
): Attributes {
  switch (trigger.type) {
    case 'attacking':
      if (ctx.isAttacking) return applyBoost(attrs, trigger.boost);
      break;
    case 'defending':
      if (!ctx.isAttacking) return applyBoost(attrs, trigger.boost);
      break;
    case 'responding':
      if (!ctx.isAttacking) return applyBoost(attrs, trigger.boost);
      break;
    case 'if_attribute_chosen':
      if (ctx.chosenAttrs.includes(trigger.attribute)) return applyBoost(attrs, trigger.boost);
      break;
    case 'choose_declared_attr': {
      // Player picks the best declared attr to boost
      const bestAttr = ctx.chosenAttrs.reduce<AttributeKey | null>((best, attr) => {
        if (!best) return attr;
        return attrs[attr] > attrs[best] ? attr : best;
      }, null);
      if (bestAttr) attrs = { ...attrs, [bestAttr]: Math.min(10, attrs[bestAttr] + trigger.boost) };
      break;
    }
    case 'flat':
      return applyBoost(attrs, trigger.boost);
    case 'after_opponent_declares':
      // handled at caller level — no attr change on self
      break;
  }
  return attrs;
}
