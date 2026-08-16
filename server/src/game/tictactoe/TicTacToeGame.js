import { createEmptyBoard, isBoardFull, findWinningLine, SIZE } from "./rules.js";

export class TicTacToeGame {
  constructor(startPosition) {
    this.startPosition = startPosition;
    this.phase = "playing";
    this.board = createEmptyBoard();
    this.currentTurn = startPosition;
    this.lastMove = null; // { row, col }
    this.outcome = null; // { type: "win", winnerPosition, line } | { type: "draw" }
  }

  opponent(position) {
    return position === 0 ? 1 : 0;
  }

  move(position, row, col) {
    if (this.phase !== "playing") throw new Error("Jogo não está a decorrer");
    if (this.currentTurn !== position) throw new Error("Não é a tua vez");
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row >= SIZE || col < 0 || col >= SIZE) {
      throw new Error("Casa inválida");
    }
    if (this.board[row][col] !== null) throw new Error("Essa casa já está ocupada");

    this.board[row][col] = position;
    this.lastMove = { row, col };

    const line = findWinningLine(this.board, position);
    if (line) {
      this.phase = "round-over";
      this.outcome = { type: "win", winnerPosition: position, line };
      return { roundOver: true };
    }

    if (isBoardFull(this.board)) {
      this.phase = "round-over";
      this.outcome = { type: "draw" };
      return { roundOver: true };
    }

    this.currentTurn = this.opponent(position);
    return { roundOver: false };
  }

  // { scoreDelta: { p0, p1 }, summary } — igual à interface dos outros jogos
  getResult() {
    if (this.phase !== "round-over") return null;
    const scoreDelta = { p0: 0, p1: 0 };
    if (this.outcome.type === "win") scoreDelta[`p${this.outcome.winnerPosition}`] = 1;
    return { scoreDelta, summary: { ...this.outcome } };
  }

  viewFor() {
    return {
      gameType: "tictactoe",
      phase: this.phase,
      startPosition: this.startPosition,
      currentTurn: this.currentTurn,
      board: this.board,
      lastMove: this.lastMove,
      outcome: this.outcome,
    };
  }
}
