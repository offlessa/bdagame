import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  MC_CARDS, BEAT_CARDS, MOMENT_CARDS,
  createBattle, startRound, setBeat, chooseAttrs,
  revealMCs, activateFatality, revealMoment, swapMoment,
  calculateRound, shuffle, AttributeKey, MCCard, BeatCard, MomentCard,
} from '@batalha/game-engine';
import { createRoom, getRoom, updateRoom } from './roomStore';

function userId(socket: Socket): string {
  return (socket.data as { userId: string }).userId;
}

function emit(io: Server, roomId: string, event: string, data: unknown): void {
  io.to(roomId).emit(event, data);
}

export function registerGameHandlers(io: Server, socket: Socket): void {
  const uid = userId(socket);

  // ── Lobby ─────────────────────────────────────────────────────────────────

  socket.on('room:create', () => {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    createRoom(roomId, uid);
    socket.join(roomId);
    socket.emit('room:created', { roomId });
  });

  socket.on('room:join', ({ roomId }: { roomId: string }) => {
    const room = getRoom(roomId);
    if (!room) { socket.emit('error', 'Sala não encontrada'); return; }
    if (room.guestId) { socket.emit('error', 'Sala cheia'); return; }
    room.guestId = uid;
    room.status = 'draft';
    updateRoom(room);
    socket.join(roomId);
    emit(io, roomId, 'room:full', { hostId: room.hostId, guestId: uid });
  });

  // ── Draft: player sends ordered MC ids ───────────────────────────────────

  socket.on('draft:ready', ({ roomId, mcIds }: { roomId: string; mcIds: string[] }) => {
    const room = getRoom(roomId);
    if (!room) return;
    if (mcIds.length !== 3) { socket.emit('error', 'Selecione exatamente 3 MCs'); return; }

    room.playerHand[uid] = mcIds;
    room.playerReady[uid] = true;
    updateRoom(room);

    const allReady = [room.hostId, room.guestId!].every((id) => room.playerReady[id]);
    if (allReady) {
      const firstAttacker = Math.random() < 0.5 ? room.hostId : room.guestId!;
      const hand = (id: string): MCCard[] =>
        room.playerHand[id].map((mcId) => MC_CARDS.find((m) => m.id === mcId)!);

      const battle = createBattle(roomId, room.hostId, room.guestId!, hand(room.hostId), hand(room.guestId!), firstAttacker);
      const withRound = startRound(battle, 1);
      room.battle = withRound;
      room.status = 'playing';
      updateRoom(room);
      emit(io, roomId, 'battle:start', { battle: withRound, beatDeck: shuffle(BEAT_CARDS).map((b) => b.id) });
    }
  });

  // ── Round actions ────────────────────────────────────────────────────────

  socket.on('round:draw_beat', ({ roomId, beatId }: { roomId: string; beatId: string }) => {
    const room = getRoom(roomId);
    if (!room?.battle) return;
    const beat = BEAT_CARDS.find((b) => b.id === beatId);
    if (!beat) return;
    room.battle = setBeat(room.battle, beat);
    updateRoom(room);
    emit(io, roomId, 'round:beat_set', { beat });
  });

  socket.on('round:choose_attrs', ({ roomId, attrs }: { roomId: string; attrs: AttributeKey[] }) => {
    const room = getRoom(roomId);
    if (!room?.battle) return;
    room.battle = chooseAttrs(room.battle, uid, attrs);
    updateRoom(room);
    emit(io, roomId, 'round:attrs_chosen', { playerId: uid, count: attrs.length });

    if (room.battle.currentRound?.phase === 'reveal_mcs') {
      room.battle = revealMCs(room.battle);
      updateRoom(room);
      emit(io, roomId, 'round:mcs_revealed', { battle: room.battle });
    }
  });

  socket.on('round:fatality', ({ roomId }: { roomId: string }) => {
    const room = getRoom(roomId);
    if (!room?.battle) return;
    try {
      room.battle = activateFatality(room.battle, uid);
      updateRoom(room);
      emit(io, roomId, 'round:fatality_activated', { playerId: uid });
    } catch (e: unknown) {
      socket.emit('error', (e as Error).message);
    }
  });

  socket.on('round:fatality_done', ({ roomId }: { roomId: string }) => {
    const room = getRoom(roomId);
    if (!room?.battle) return;
    emit(io, roomId, 'round:draw_moment', {});
  });

  socket.on('round:reveal_moment', ({ roomId, momentId }: { roomId: string; momentId: string }) => {
    const room = getRoom(roomId);
    if (!room?.battle) return;
    const moment = MOMENT_CARDS.find((m) => m.id === momentId);
    if (!moment) return;
    room.battle = revealMoment(room.battle, moment);
    updateRoom(room);
    emit(io, roomId, 'round:moment_revealed', { moment });
  });

  socket.on('round:swap_moment', ({ roomId, newMomentId }: { roomId: string; newMomentId: string }) => {
    const room = getRoom(roomId);
    if (!room?.battle) return;
    const newMoment = MOMENT_CARDS.find((m) => m.id === newMomentId);
    if (!newMoment) return;
    try {
      room.battle = swapMoment(room.battle, uid, newMoment);
      updateRoom(room);
      emit(io, roomId, 'round:moment_swapped', { newMoment, by: uid });
    } catch (e: unknown) {
      socket.emit('error', (e as Error).message);
    }
  });

  socket.on('round:calculate', ({ roomId }: { roomId: string }) => {
    const room = getRoom(roomId);
    if (!room?.battle) return;
    room.battle = calculateRound(room.battle);
    updateRoom(room);
    emit(io, roomId, 'round:result', { battle: room.battle });

    if (room.battle.phase === 'battle_over') {
      room.status = 'finished';
      updateRoom(room);
      emit(io, roomId, 'battle:over', { winnerId: room.battle.winner, log: room.battle.log });
      return;
    }

    // Advance to next round
    const nextRound = (room.battle.players[0].roundsWon + room.battle.players[1].roundsWon + 1) as 1 | 2 | 3;
    if (nextRound <= 3) {
      room.battle = startRound(room.battle, nextRound);
      updateRoom(room);
      emit(io, roomId, 'round:start', { battle: room.battle });
    }
  });
}
