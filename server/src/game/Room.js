import { Game as SuecaGame } from "./Game.js";
import { DominoGame } from "./domino/DominoGame.js";
import { CheckersGame } from "./checkers/CheckersGame.js";
import { Connect4Game } from "./connect4/Connect4Game.js";
import { TicTacToeGame } from "./tictactoe/TicTacToeGame.js";
import { PeixinhoGame } from "./peixinho/PeixinhoGame.js";

// Para a maioria dos jogos min === max (número fixo de jogadores). O Peixinho
// aceita entre 2 e 5 — a sala pode começar assim que todos os presentes
// estiverem prontos, sem ter de encher os 5 lugares.
const MIN_PLAYERS = { sueca: 4, domino: 2, checkers: 2, connect4: 2, tictactoe: 2, peixinho: 2 };
const MAX_PLAYERS = { sueca: 4, domino: 2, checkers: 2, connect4: 2, tictactoe: 2, peixinho: 5 };
const GAME_CLASS = {
  sueca: SuecaGame,
  domino: DominoGame,
  checkers: CheckersGame,
  connect4: Connect4Game,
  tictactoe: TicTacToeGame,
  peixinho: PeixinhoGame,
};

export class Room {
  constructor(id, gameType) {
    this.id = id;
    this.gameType = gameType; // "sueca" | "domino" | "checkers" | "connect4" | "tictactoe" | "peixinho" — fixado pelo 1º jogador a entrar
    this.minPlayers = MIN_PLAYERS[gameType];
    this.maxPlayers = MAX_PLAYERS[gameType];
    this.players = []; // { socketId, name, position, connected }
    this.sessionScore = {}; // chaves dependem do jogo: team1/team2 (sueca) ou p0/p1/p2... (restantes)
    this.game = null;
    this.leadPosition = 0; // dealer (sueca) ou quem começa; roda a cada partida
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
    return this.players.length >= this.minPlayers && this.players.every((p) => p.connected);
  }

  // Só é preciso que todos os presentes estejam prontos (não é preciso encher a sala).
  markReady(socketId) {
    this.readySet.add(socketId);
    return this.readySet.size >= this.minPlayers && this.readySet.size === this.players.length;
  }

  startGame() {
    this.game = new GAME_CLASS[this.gameType](this.leadPosition, this.players.length);
    this.readySet.clear();
    return this.game;
  }

  finishGameAndTally() {
    const result = this.game.getResult();
    for (const [key, value] of Object.entries(result.scoreDelta)) {
      this.sessionScore[key] = (this.sessionScore[key] || 0) + value;
    }
    this.leadPosition = (this.leadPosition + 1) % this.players.length;
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
