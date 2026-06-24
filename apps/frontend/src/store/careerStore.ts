import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CareerState, Attributes, AttributeKey } from '../types/game';

const STORAGE_KEY = 'rap-battle:career';

const BASE_ATTRS: Attributes = {
  flow: 5, tecnica: 5, frieza: 5, inteligencia: 5, presenca: 5, punchline: 5,
};

const INITIAL: CareerState = {
  level: 1,
  rp: 0,
  hype: 0,
  attributePoints: 0,
  attributes: { ...BASE_ATTRS },
  currentMapId: 'underground-sp',
  unlockedMapIds: ['underground-sp'],
  defeatedNpcIds: [],
  friendships: {},
  partners: [],
  trophies: [],
  leaves: 0,
  lastPlayedDate: null,
};

// ── Helpers de data ───────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// ── RP (Pontos de Rima) ───────────────────────────────────────────────────────

export function rpForLevel(level: number): number {
  return level * 100;
}

export function rpFromBattle(won: boolean, difficulty: 1 | 2 | 3, playerScore: number, npcScore: number): number {
  const base  = won ? 50 : 15;
  const bonus = Math.floor(Math.max(0, playerScore - npcScore) / 10);
  return (base + bonus) * difficulty;
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface CareerStore extends CareerState {
  load: () => Promise<void>;
  save: () => Promise<void>;
  spendAttributePoint: (attr: AttributeKey) => void;
  addBattleResult: (params: {
    won: boolean;
    npcId: string;
    difficulty: 1 | 2 | 3;
    playerScore: number;
    npcScore: number;
  }) => void;
  registerDayStreak: () => void;
  addFriendship: (npcId: string, amount: number) => void;
  addPartner: (npcId: string) => void;
  unlockMap: (mapId: string) => void;
  reset: () => void;
}

export const useCareerStore = create<CareerStore>((set, get) => ({
  ...INITIAL,

  async load() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Migração: campo antigo xp → rp
        if ('xp' in parsed && !('rp' in parsed)) {
          parsed.rp = parsed.xp;
          delete parsed.xp;
        }
        set({ ...INITIAL, ...parsed });
      }
    } catch {}
  },

  async save() {
    try {
      const {
        load, save, spendAttributePoint, addBattleResult,
        registerDayStreak, addFriendship, addPartner, unlockMap, reset,
        ...data
      } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  },

  registerDayStreak() {
    const s     = get();
    const today = todayStr();
    if (s.lastPlayedDate === today) return;

    const newHype = s.lastPlayedDate === yesterdayStr()
      ? s.hype + 1
      : 1;

    set({ hype: newHype, lastPlayedDate: today });
    get().save();
  },

  spendAttributePoint(attr) {
    const s = get();
    if (s.attributePoints <= 0) return;
    set({
      attributePoints: s.attributePoints - 1,
      attributes: { ...s.attributes, [attr]: s.attributes[attr] + 1 },
    });
    get().save();
  },

  addBattleResult({ won, npcId, difficulty, playerScore, npcScore }) {
    const s        = get();
    const gainedRp = rpFromBattle(won, difficulty, playerScore, npcScore);

    let newRp     = s.rp + gainedRp;
    let newLevel  = s.level;
    let newPoints = s.attributePoints;

    while (newRp >= rpForLevel(newLevel)) {
      newRp    -= rpForLevel(newLevel);
      newLevel  += 1;
      newPoints += 2;
    }

    const defeatedNpcIds = won && !s.defeatedNpcIds.includes(npcId)
      ? [...s.defeatedNpcIds, npcId]
      : s.defeatedNpcIds;

    set({ rp: newRp, level: newLevel, attributePoints: newPoints, defeatedNpcIds });

    get().registerDayStreak();
    get().save();
  },

  addFriendship(npcId, amount) {
    const s = get();
    const current = s.friendships[npcId] ?? 0;
    set({ friendships: { ...s.friendships, [npcId]: Math.min(100, current + amount) } });
    get().save();
  },

  addPartner(npcId) {
    const s = get();
    if (s.partners.includes(npcId)) return;
    set({ partners: [...s.partners, npcId] });
    get().save();
  },

  unlockMap(mapId) {
    const s = get();
    if (s.unlockedMapIds.includes(mapId)) return;
    set({ unlockedMapIds: [...s.unlockedMapIds, mapId] });
    get().save();
  },

  reset() {
    set({ ...INITIAL });
    AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
