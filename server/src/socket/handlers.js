import { Room } from "../game/Room.js";

const rooms = new Map(); // roomId -> Room
const GAME_LABEL = {
  sueca: "Sueca",
  domino: "Dominó",
  checkers: "Damas",
  connect4: "Quatro em Linha",
  tictactoe: "Jogo do Galo",
};

function broadcastGameState(io, room) {
  if (!room.game) return;
  for (const player of room.players) {
    if (!player.connected) continue;
    io.to(player.socketId).emit("game-state", room.game.viewFor(player.position));
  }
  for (const spectator of room.spectators) {
    io.to(spectator.socketId).emit("game-state", room.game.viewFor(null));
  }
}

function roomUpdatePayload(room) {
  return {
    players: room.publicPlayers(),
    sessionScore: room.sessionScore,
    gameType: room.gameType,
    maxPlayers: room.maxPlayers,
    spectatorCount: room.spectators.length,
  };
}

export function registerSocketHandlers(io, socket) {
  socket.on("suggest-room-name", ({ prefix } = {}, callback) => {
    const base = (prefix || "sala").trim() || "sala";
    let n = 1;
    while (rooms.has(`${base}-${n}`)) n++;
    callback?.({ roomId: `${base}-${n}` });
  });

  socket.on("join-game", ({ roomId, playerName, gameType }, callback) => {
    try {
      let room = rooms.get(roomId);

      if (!room) {
        if (!GAME_LABEL[gameType]) {
          throw new Error("Escolhe um jogo válido");
        }
        room = new Room(roomId, gameType);
        rooms.set(roomId, room);
      } else if (gameType && gameType !== room.gameType) {
        throw new Error(`Esta sala já está a jogar ${GAME_LABEL[room.gameType]}. Escolhe outra sala.`);
      }

      // reconexão: mesmo nome numa posição já existente mas desligada
      const existing = room.players.find((p) => p.name === playerName && !p.connected);
      let player = null;
      let isSpectator = false;

      if (existing) {
        existing.socketId = socket.id;
        existing.connected = true;
        player = existing;
      } else if (!room.isFull()) {
        player = room.addPlayer(socket.id, playerName);
      } else {
        room.addSpectator(socket.id, playerName);
        isSpectator = true;
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      if (isSpectator) {
        socket.data.spectator = true;
      } else {
        socket.data.position = player.position;
      }

      callback?.({
        ok: true,
        spectator: isSpectator,
        position: isSpectator ? null : player.position,
        players: room.publicPlayers(),
        gameType: room.gameType,
        maxPlayers: room.maxPlayers,
        spectatorCount: room.spectators.length,
      });

      io.to(roomId).emit("room-update", roomUpdatePayload(room));

      if (room.game) {
        socket.emit("game-state", room.game.viewFor(isSpectator ? null : player.position));
      }
    } catch (err) {
      callback?.({ ok: false, reason: err.message });
    }
  });

  socket.on("player-ready", () => {
    if (socket.data.spectator) return;
    const room = rooms.get(socket.data.roomId);
    if (!room) return;

    const allReady = room.markReady(socket.id);
    io.to(room.id).emit("ready-update", { readyCount: room.readySet.size, needed: room.maxPlayers });

    if (allReady && room.allConnected()) {
      const game = room.startGame();
      io.to(room.id).emit("game-started", { leadPosition: game.startPosition ?? game.dealerPosition });
      broadcastGameState(io, room);
    }
  });

  function handleRoundOverIfNeeded(io, room, result) {
    if (!result.roundOver) return;
    const finished = room.finishGameAndTally();
    io.to(room.id).emit("round-over", finished);
  }

  // --- Sueca ---
  socket.on("play-card", ({ cardId }, callback) => {
    if (socket.data.spectator) return callback?.({ ok: false, reason: "Estás a assistir, não podes jogar" });
    const room = rooms.get(socket.data.roomId);
    if (!room?.game || room.gameType !== "sueca") return callback?.({ ok: false, reason: "Jogo não iniciado" });

    try {
      const result = room.game.playCard(socket.data.position, cardId);
      callback?.({ ok: true });
      broadcastGameState(io, room);
      handleRoundOverIfNeeded(io, room, { roundOver: result.roundOver });
    } catch (err) {
      callback?.({ ok: false, reason: err.message });
    }
  });

  // --- Dominó ---
  socket.on("play-domino", ({ pieceId, side }, callback) => {
    if (socket.data.spectator) return callback?.({ ok: false, reason: "Estás a assistir, não podes jogar" });
    const room = rooms.get(socket.data.roomId);
    if (!room?.game || room.gameType !== "domino") return callback?.({ ok: false, reason: "Jogo não iniciado" });

    try {
      const result = room.game.playPiece(socket.data.position, pieceId, side);
      callback?.({ ok: true });
      broadcastGameState(io, room);
      handleRoundOverIfNeeded(io, room, result);
    } catch (err) {
      callback?.({ ok: false, reason: err.message });
    }
  });

  socket.on("draw-domino-tile", (_payload, callback) => {
    if (socket.data.spectator) return callback?.({ ok: false, reason: "Estás a assistir, não podes jogar" });
    const room = rooms.get(socket.data.roomId);
    if (!room?.game || room.gameType !== "domino") return callback?.({ ok: false, reason: "Jogo não iniciado" });

    try {
      const result = room.game.drawTile(socket.data.position);
      callback?.({ ok: true });
      broadcastGameState(io, room);
      handleRoundOverIfNeeded(io, room, { roundOver: !!result.roundOver });
    } catch (err) {
      callback?.({ ok: false, reason: err.message });
    }
  });

  socket.on("pass-domino-turn", (_payload, callback) => {
    if (socket.data.spectator) return callback?.({ ok: false, reason: "Estás a assistir, não podes jogar" });
    const room = rooms.get(socket.data.roomId);
    if (!room?.game || room.gameType !== "domino") return callback?.({ ok: false, reason: "Jogo não iniciado" });

    try {
      const result = room.game.passTurn(socket.data.position);
      callback?.({ ok: true });
      broadcastGameState(io, room);
      handleRoundOverIfNeeded(io, room, { roundOver: !!result.roundOver });
    } catch (err) {
      callback?.({ ok: false, reason: err.message });
    }
  });

  // --- Damas ---
  socket.on("checkers-move", ({ from, to }, callback) => {
    if (socket.data.spectator) return callback?.({ ok: false, reason: "Estás a assistir, não podes jogar" });
    const room = rooms.get(socket.data.roomId);
    if (!room?.game || room.gameType !== "checkers") return callback?.({ ok: false, reason: "Jogo não iniciado" });

    try {
      const result = room.game.move(socket.data.position, from, to);
      callback?.({ ok: true });
      broadcastGameState(io, room);
      handleRoundOverIfNeeded(io, room, { roundOver: !!result.roundOver });
    } catch (err) {
      callback?.({ ok: false, reason: err.message });
    }
  });

  // --- Quatro em Linha ---
  socket.on("connect4-move", ({ column }, callback) => {
    if (socket.data.spectator) return callback?.({ ok: false, reason: "Estás a assistir, não podes jogar" });
    const room = rooms.get(socket.data.roomId);
    if (!room?.game || room.gameType !== "connect4") return callback?.({ ok: false, reason: "Jogo não iniciado" });

    try {
      const result = room.game.move(socket.data.position, column);
      callback?.({ ok: true });
      broadcastGameState(io, room);
      handleRoundOverIfNeeded(io, room, { roundOver: !!result.roundOver });
    } catch (err) {
      callback?.({ ok: false, reason: err.message });
    }
  });

  // --- Jogo do Galo ---
  socket.on("tictactoe-move", ({ row, col }, callback) => {
    if (socket.data.spectator) return callback?.({ ok: false, reason: "Estás a assistir, não podes jogar" });
    const room = rooms.get(socket.data.roomId);
    if (!room?.game || room.gameType !== "tictactoe") return callback?.({ ok: false, reason: "Jogo não iniciado" });

    try {
      const result = room.game.move(socket.data.position, row, col);
      callback?.({ ok: true });
      broadcastGameState(io, room);
      handleRoundOverIfNeeded(io, room, { roundOver: !!result.roundOver });
    } catch (err) {
      callback?.({ ok: false, reason: err.message });
    }
  });

  socket.on("request-new-round", () => {
    if (socket.data.spectator) return;
    const room = rooms.get(socket.data.roomId);
    if (!room || room.game) return;
    room.readySet.clear();
    io.to(room.id).emit("ready-update", { readyCount: 0, needed: room.maxPlayers });
  });

  socket.on("disconnect", () => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    if (socket.data.spectator) {
      room.removeSpectator(socket.id);
    } else {
      room.removePlayer(socket.id);
    }
    io.to(room.id).emit("room-update", roomUpdatePayload(room));
  });
}
