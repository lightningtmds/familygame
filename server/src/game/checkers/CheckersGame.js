import { createInitialBoard, computeLegalMoves, isPromotionRow, squareKey } from "./rules.js";

export class CheckersGame {
  constructor(startPosition) {
    this.startPosition = startPosition;
    this.phase = "playing";
    this.board = createInitialBoard();
    this.currentTurn = startPosition;
    this.forcedOrigin = null; // {row,col} enquanto uma sequência de captura está a meio
    this.lastMove = null; // { from, to, captured } — última jogada, para destaque no cliente
    this.outcome = null; // { winnerPosition, reason: "sem-pecas" | "sem-jogadas" }
  }

  opponent(position) {
    return position === 0 ? 1 : 0;
  }

  countPieces(position) {
    let n = 0;
    for (const row of this.board) {
      for (const cell of row) {
        if (cell && cell.owner === position) n++;
      }
    }
    return n;
  }

  move(position, from, to) {
    if (this.phase !== "playing") throw new Error("Jogo não está a decorrer");
    if (this.currentTurn !== position) throw new Error("Não é a tua vez");
    if (this.forcedOrigin && (this.forcedOrigin.row !== from.row || this.forcedOrigin.col !== from.col)) {
      throw new Error("Tens de continuar a jogar a mesma peça");
    }

    const legal = computeLegalMoves(this.board, position, this.forcedOrigin);
    const options = legal.movesByOrigin[squareKey(from.row, from.col)];
    if (!options) throw new Error("Não tens jogadas com essa peça");
    const chosen = options.find((o) => o.to.row === to.row && o.to.col === to.col);
    if (!chosen) throw new Error("Jogada inválida");

    const piece = this.board[from.row][from.col];
    this.board[from.row][from.col] = null;
    if (chosen.captured) this.board[chosen.captured.row][chosen.captured.col] = null;

    const promoted = !piece.king && isPromotionRow(to.row, piece.owner);
    if (promoted) piece.king = true;
    this.board[to.row][to.col] = piece;
    this.lastMove = { from, to, captured: chosen.captured ?? null };

    if (chosen.captured && !promoted) {
      const further = computeLegalMoves(this.board, position, { row: to.row, col: to.col });
      if (further.mustCapture) {
        this.forcedOrigin = { row: to.row, col: to.col };
        return { roundOver: false };
      }
    }

    this.forcedOrigin = null;
    this.currentTurn = this.opponent(position);
    return this._afterTurnSwitch();
  }

  _afterTurnSwitch() {
    if (this.countPieces(this.currentTurn) === 0) {
      this.phase = "round-over";
      this.outcome = { winnerPosition: this.opponent(this.currentTurn), reason: "sem-pecas" };
      return { roundOver: true };
    }
    const legal = computeLegalMoves(this.board, this.currentTurn, null);
    if (Object.keys(legal.movesByOrigin).length === 0) {
      this.phase = "round-over";
      this.outcome = { winnerPosition: this.opponent(this.currentTurn), reason: "sem-jogadas" };
      return { roundOver: true };
    }
    return { roundOver: false };
  }

  // { scoreDelta: { p0, p1 }, summary } — igual à interface do DominoGame
  getResult() {
    if (this.phase !== "round-over") return null;
    const winner = this.outcome.winnerPosition;
    const scoreDelta = { p0: 0, p1: 0 };
    scoreDelta[`p${winner}`] = 1;
    return { scoreDelta, summary: { winnerPosition: winner, reason: this.outcome.reason } };
  }

  viewFor(position) {
    const legal = this.phase === "playing" ? computeLegalMoves(this.board, this.currentTurn, this.forcedOrigin) : null;
    return {
      gameType: "checkers",
      phase: this.phase,
      startPosition: this.startPosition,
      currentTurn: this.currentTurn,
      board: this.board,
      forcedOrigin: this.forcedOrigin,
      mustCapture: legal?.mustCapture ?? false,
      legalMoves: legal && position === this.currentTurn ? legal.movesByOrigin : {},
      lastMove: this.lastMove,
      outcome: this.outcome,
    };
  }
}
