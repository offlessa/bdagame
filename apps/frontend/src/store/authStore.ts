import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  userId: string | null;
  username: string | null;
  setAuth: (token: string, userId: string, username: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  username: null,

  setAuth: async (token, userId, username, remember = true) => {
    if (remember) {
      await AsyncStorage.setItem('auth', JSON.stringify({ token, userId, username }));
    } else {
      await AsyncStorage.removeItem('auth');
    }
    set({ token, userId, username });
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth');
    set({ token: null, userId: null, username: null });
  },

  loadFromStorage: async () => {
    const raw = await AsyncStorage.getItem('auth');
    if (raw) {
      const { token, userId, username } = JSON.parse(raw) as { token: string; userId: string; username: string };
      set({ token, userId, username });
    }
  },
}));
