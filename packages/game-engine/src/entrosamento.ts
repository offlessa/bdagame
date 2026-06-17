import { MCCard } from './types';

export function calcEntrosamento(trio: MCCard[]): number {
  const stateCounts: Record<string, number> = {};
  let legendCount = 0;

  for (const mc of trio) {
    stateCounts[mc.state] = (stateCounts[mc.state] ?? 0) + 1;
    if (mc.isLegend) legendCount++;
  }

  const counts = Object.values(stateCounts);
  let base = 0;

  if (counts.some((c) => c === 3)) base = 3;
  else if (counts.some((c) => c === 2)) base = 2;
  else base = 0;

  // Each LEGEND card adds +1 entrosamento with every other MC in the trio
  return base + legendCount;
}
