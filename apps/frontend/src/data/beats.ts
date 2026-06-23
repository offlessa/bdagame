import { Beat } from '../types/game';

export const BEATS: Beat[] = [
  {
    id: 'trap',
    name: 'Trap',
    emoji: '🔥',
    primaryAttr: 'flow',
    attrBonus: { flow: 2, presenca: 1, inteligencia: -1 },
  },
  {
    id: 'old-school',
    name: 'Old School',
    emoji: '🎙️',
    primaryAttr: 'tecnica',
    attrBonus: { tecnica: 2, inteligencia: 2, flow: -1 },
  },
  {
    id: 'freestyle',
    name: 'Freestyle',
    emoji: '⚡',
    primaryAttr: 'punchline',
    attrBonus: { punchline: 3, frieza: -1 },
  },
  {
    id: 'boom-bap',
    name: 'Boom Bap',
    emoji: '💥',
    primaryAttr: 'frieza',
    attrBonus: { frieza: 2, presenca: 1, punchline: -1 },
  },
  {
    id: 'drill',
    name: 'Drill',
    emoji: '🗡️',
    primaryAttr: 'frieza',
    attrBonus: { frieza: 3, tecnica: -1, inteligencia: -1 },
  },
  {
    id: 'conscious',
    name: 'Conscious',
    emoji: '🧠',
    primaryAttr: 'inteligencia',
    attrBonus: { inteligencia: 3, punchline: 1, presenca: -2 },
  },
  {
    id: 'samba-rap',
    name: 'Samba Rap',
    emoji: '🎺',
    primaryAttr: 'presenca',
    attrBonus: { presenca: 2, flow: 1 },
  },
];

export function getBeat(id: string): Beat {
  return BEATS.find(b => b.id === id) ?? BEATS[0];
}

export function randomBeat(): Beat {
  return BEATS[Math.floor(Math.random() * BEATS.length)];
}
