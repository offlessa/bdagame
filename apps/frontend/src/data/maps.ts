import { GameMap } from '../types/game';

export const MAPS: GameMap[] = [
  {
    id: 'underground-sp',
    name: 'Underground SP',
    tier: 'underground',
    emoji: '🏚️',
    requiredLevel: 1,
    requiredHype: 0,
    npcIds: ['zé-do-beco', 'luana-flow', 'dread-beats', 'fantasma', 'dona-cida'],
  },
  {
    id: 'clube-noturno',
    name: 'Clube Noturno',
    tier: 'clube',
    emoji: '🎧',
    requiredLevel: 5,
    requiredHype: 200,
    npcIds: [],
  },
  {
    id: 'festival-verão',
    name: 'Festival de Verão',
    tier: 'festival',
    emoji: '🎪',
    requiredLevel: 10,
    requiredHype: 600,
    npcIds: [],
  },
  {
    id: 'arena-nacional',
    name: 'Arena Nacional',
    tier: 'evento',
    emoji: '🏟️',
    requiredLevel: 20,
    requiredHype: 2000,
    npcIds: [],
  },
];

export function getMap(id: string): GameMap | undefined {
  return MAPS.find(m => m.id === id);
}
