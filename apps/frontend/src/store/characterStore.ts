import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CharacterLook {
  // skin (reserved for future tones)
  pele: string;
  // face
  cabelo: string;
  sobrancelha: string;
  olhos: string;
  nariz: string;
  boca: string;
  // outfit
  roupa_top: string;
  roupa_calca: string;
  calcado: string;
  // acessórios
  mic: string;
  // cores ('' = original)
  cor_cabelo: string;
  cor_sobrancelha: string;
  cor_olhos: string;
  cor_nariz: string;
  cor_boca: string;
  cor_roupa_top: string;
  cor_roupa_calca: string;
  cor_calcado: string;
  cor_mic: string;
}

export const DEFAULT_LOOK: CharacterLook = {
  pele: '1',
  cabelo: '1',
  sobrancelha: '1',
  olhos: '1',
  nariz: '1',
  boca: '1',
  roupa_top: '1',
  roupa_calca: '1',
  calcado: '1',
  mic: '1',
  cor_cabelo: '',
  cor_sobrancelha: '',
  cor_olhos: '',
  cor_nariz: '',
  cor_boca: '',
  cor_roupa_top: '',
  cor_roupa_calca: '',
  cor_calcado: '',
  cor_mic: '',
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
