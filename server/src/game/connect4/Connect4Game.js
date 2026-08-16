import { createEmptyBoard, dropRow, isBoardFull, findWinningLine } from "./rules.js";

export class Connect4Game {
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

  move(position, column) {
    if (this.phase !== "playing") throw new Error("Jogo não está a decorrer");
    if (this.currentTurn !== position) throw new Error("Não é a tua vez");
    if (!Number.isInteger(column) || column < 0 || column >= this.board[0].length) {
      throw new Error("Coluna inválida");
    }

    const row = dropRow(this.board, column);
    if (row === -1) throw new Error("Essa coluna está cheia");

    this.board[row][column] = position;
    this.lastMove = { row, col: column };

    const line = findWinningLine(this.board, row, column, position);
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
      gameType: "connect4",
      phase: this.phase,
      startPosition: this.startPosition,
      currentTurn: this.currentTurn,
      board: this.board,
      lastMove: this.lastMove,
      outcome: this.outcome,
    };
  }
}
