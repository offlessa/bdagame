import { BattleState } from '@batalha/game-engine';

export interface Room {
  id: string;
  hostId: string;
  guestId: string | null;
  battle: BattleState | null;
  status: 'waiting' | 'draft' | 'playing' | 'finished';
  playerReady: Record<string, boolean>;
  playerHand: Record<string, string[]>;
}

const rooms = new Map<string, Room>();

export function createRoom(roomId: string, hostId: string): Room {
  const room: Room = {
    id: roomId,
    hostId,
    guestId: null,
    battle: null,
    status: 'waiting',
    playerReady: {},
    playerHand: {},
  };
  rooms.set(roomId, room);
  return room;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function updateRoom(room: Room): void {
  rooms.set(room.id, room);
}

export function deleteRoom(roomId: string): void {
  rooms.delete(roomId);
}
