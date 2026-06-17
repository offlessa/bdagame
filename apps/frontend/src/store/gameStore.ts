import { create } from 'zustand';
import { BattleState, MCCard, BeatCard, MomentCard } from '@batalha/game-engine';

interface GameState {
  roomId: string | null;
  battle: BattleState | null;
  myId: string | null;
  opponentId: string | null;
  lastBeat: BeatCard | null;
  lastMoment: MomentCard | null;
  availableMCs: MCCard[];
  selectedMCIds: string[];
  phase: 'idle' | 'lobby' | 'draft' | 'battle' | 'result';

  setRoom: (roomId: string, myId: string, opponentId: string) => void;
  setBattle: (battle: BattleState) => void;
  setLastBeat: (beat: BeatCard) => void;
  setLastMoment: (moment: MomentCard) => void;
  toggleSelectMC: (id: string) => void;
  setPhase: (phase: GameState['phase']) => void;
  setAvailableMCs: (mcs: MCCard[]) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  roomId: null,
  battle: null,
  myId: null,
  opponentId: null,
  lastBeat: null,
  lastMoment: null,
  availableMCs: [],
  selectedMCIds: [],
  phase: 'idle',

  setRoom: (roomId, myId, opponentId) => set({ roomId, myId, opponentId, phase: 'draft' }),
  setBattle: (battle) => set({ battle, phase: 'battle' }),
  setLastBeat: (beat) => set({ lastBeat: beat }),
  setLastMoment: (moment) => set({ lastMoment: moment }),
  setAvailableMCs: (mcs) => set({ availableMCs: mcs }),
  setPhase: (phase) => set({ phase }),

  toggleSelectMC: (id) => {
    const { selectedMCIds } = get();
    if (selectedMCIds.includes(id)) {
      set({ selectedMCIds: selectedMCIds.filter((x) => x !== id) });
    } else if (selectedMCIds.length < 3) {
      set({ selectedMCIds: [...selectedMCIds, id] });
    }
  },

  reset: () => set({
    roomId: null, battle: null, myId: null, opponentId: null,
    lastBeat: null, lastMoment: null, selectedMCIds: [], phase: 'idle',
  }),
}));
