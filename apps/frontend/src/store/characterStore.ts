import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CharacterLook {
  olhos: string;   // '1'–'5'
  nariz: string;   // '1'–'5'
  boca: string;    // '1'–'5'
}

export const DEFAULT_LOOK: CharacterLook = {
  olhos: '1',
  nariz: '1',
  boca: '1',
};

export interface Character {
  battleName: string;
  archetype: string;
  archetypeIcon: string;
  archetypeColor: string;
  look: CharacterLook;
}

interface CharacterState {
  character: Character | null;
  setCharacter: (c: Character, userId: string) => Promise<void>;
  updateLook: (look: CharacterLook, userId: string) => Promise<void>;
  loadCharacter: (userId: string) => Promise<void>;
  clearFromMemory: () => void;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  character: null,

  setCharacter: async (character, userId) => {
    await AsyncStorage.setItem(`character_${userId}`, JSON.stringify(character));
    set({ character });
  },

  updateLook: async (look, userId) => {
    const current = get().character;
    if (!current) return;
    const updated = { ...current, look };
    await AsyncStorage.setItem(`character_${userId}`, JSON.stringify(updated));
    set({ character: updated });
  },

  loadCharacter: async (userId) => {
    const raw = await AsyncStorage.getItem(`character_${userId}`);
    set({ character: raw ? (JSON.parse(raw) as Character) : null });
  },

  clearFromMemory: () => set({ character: null }),
}));
