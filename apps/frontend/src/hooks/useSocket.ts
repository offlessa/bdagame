import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { BattleState, BeatCard, MomentCard, MC_CARDS } from '@batalha/game-engine';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

let socketInstance: Socket | null = null;

export function useSocket() {
  const token = useAuthStore((s) => s.token);
  const { setRoom, setBattle, setLastBeat, setLastMoment, setAvailableMCs, setPhase } = useGameStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!token || initialized.current) return;
    initialized.current = true;

    socketInstance = io(BACKEND_URL, { auth: { token } });

    socketInstance.on('room:created', ({ roomId }: { roomId: string }) => {
      setPhase('lobby');
      useGameStore.setState({ roomId });
    });

    socketInstance.on('room:full', ({ hostId, guestId }: { hostId: string; guestId: string }) => {
      const myId = useAuthStore.getState().userId!;
      const opponentId = myId === hostId ? guestId : hostId;
      setRoom(useGameStore.getState().roomId!, myId, opponentId);
      setAvailableMCs(MC_CARDS);
    });

    socketInstance.on('battle:start', ({ battle }: { battle: BattleState }) => {
      setBattle(battle);
    });

    socketInstance.on('round:beat_set', ({ beat }: { beat: BeatCard }) => {
      setLastBeat(beat);
    });

    socketInstance.on('round:moment_revealed', ({ moment }: { moment: MomentCard }) => {
      setLastMoment(moment);
    });

    socketInstance.on('round:result', ({ battle }: { battle: BattleState }) => {
      setBattle(battle);
    });

    socketInstance.on('round:start', ({ battle }: { battle: BattleState }) => {
      setBattle(battle);
    });

    socketInstance.on('battle:over', ({ winnerId }: { winnerId: string }) => {
      setPhase('result');
      useGameStore.setState((s) => ({ battle: s.battle ? { ...s.battle, winner: winnerId } : s.battle }));
    });

    return () => {
      socketInstance?.disconnect();
      socketInstance = null;
      initialized.current = false;
    };
  }, [token]);

  return socketInstance;
}

export function getSocket(): Socket | null {
  return socketInstance;
}
