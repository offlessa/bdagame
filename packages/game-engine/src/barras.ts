import { AttributeKey } from './types';

export const MAX_BARRAS = 3;

export function calcBarraGains(
  attackerAttrs: { key: AttributeKey; value: number }[],
  defenderAttrs: { key: AttributeKey; value: number }[],
  attackerWon: boolean,
  scoreDiff: number,
): { attacker: number; defender: number } {
  let attackerGains = 0;
  let defenderGains = 0;

  const pairs = attackerAttrs.map((a, i) => ({ attacker: a.value, defender: defenderAttrs[i].value }));

  for (const pair of pairs) {
    if (pair.attacker > pair.defender) attackerGains++;
    else if (pair.defender > pair.attacker) defenderGains++;
    else { attackerGains++; defenderGains++; }
  }

  if (attackerWon && scoreDiff >= 3) attackerGains++;
  if (!attackerWon && attackerWon === false && scoreDiff >= 3) defenderGains++;

  return { attacker: attackerGains, defender: defenderGains };
}

export function clampBarras(current: number, gain: number): number {
  return Math.min(current + gain, MAX_BARRAS);
}
