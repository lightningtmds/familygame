import { Game as SuecaGame } from "./Game.js";
import { DominoGame } from "./domino/DominoGame.js";

const MAX_PLAYERS = { sueca: 4, domino: 2 };

export class Room {
  constructor(id, gameType) {
    this.id = id;
    this.gameType = gameType; // "sueca" | "domino" — fixado pelo 1º jogador a entrar
    this.maxPlayers = MAX_PLAYERS[gameType];
    this.players = []; // { socketId, name, position, connected }
    this.sessionScore = {}; // chaves dependem do jogo: team1/team2 (sueca) ou p0/p1 (dominó)
    this.game = null;
    this.leadPosition = 0; // dealer (sueca) ou quem começa (dominó); roda a cada partida
    this.readySet = new Set();
    this.spectators = []; // { socketId, name }
  }

  addSpectator(socketId, name) {
    this.spectators.push({ socketId, name });
  }

  removeSpectator(socketId) {
    this.spectators = this.spectators.filter((s) => s.socketId !== socketId);
  }

  isFull() {
    return this.players.length >= this.maxPlayers;
  }

  addPlayer(socketId, name) {
    if (this.isFull()) throw new Error("Sala cheia");
    const position = this.players.length;
    const player = { socketId, name, position, connected: true };
    this.players.push(player);
    return player;
  }

  removePlayer(socketId) {
    const player = this.players.find((p) => p.socketId === socketId);
    if (player) player.connected = false;
  }

  getPlayerBySocket(socketId) {
    return this.players.find((p) => p.socketId === socketId);
  }

  allConnected() {
    return this.players.length === this.maxPlayers && this.players.every((p) => p.connected);
  }

  markReady(socketId) {
    this.readySet.add(socketId);
    return this.readySet.size === this.maxPlayers;
  }

  startGame() {
    this.game =
      this.gameType === "sueca" ? new SuecaGame(this.leadPosition) : new DominoGame(this.leadPosition);
    this.readySet.clear();
    return this.game;
  }

  finishGameAndTally() {
    const result = this.game.getResult();
    for (const [key, value] of Object.entries(result.scoreDelta)) {
      this.sessionScore[key] = (this.sessionScore[key] || 0) + value;
    }
    this.leadPosition = (this.leadPosition + 1) % this.maxPlayers;
    const finished = { summary: result.summary, sessionScore: { ...this.sessionScore } };
    this.game = null;
    return finished;
  }

  publicPlayers() {
    return this.players.map((p) => ({
      name: p.name,
      position: p.position,
      connected: p.connected,
    }));
  }
}
