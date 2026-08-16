import { createDeck, shuffle, dealHands } from "./deck.js";
import { extractRank, findCompletedRanks, RANKS } from "./rules.js";

const TOTAL_RANKS = RANKS.length; // 13 peixinhos possíveis no total (52 cartas / 4)

export class PeixinhoGame {
  constructor(startPosition, playerCount) {
    this.playerCount = playerCount;
    this.phase = "playing";
    this.startPosition = startPosition % playerCount;
    this.currentTurn = this.startPosition;

    const deck = shuffle(createDeck());
    const { hands, pond } = dealHands(deck, playerCount);
    this.hands = hands; // hands[position] = Card[]
    this.pond = pond;
    this.books = Array.from({ length: playerCount }, () => []); // books[position] = ranks apanhados
    this.lastAction = null;
    this.outcome = null;
  }

  _claimBooks(position) {
    const claimed = findCompletedRanks(this.hands[position]);
    for (const rank of claimed) {
      const { remaining } = extractRank(this.hands[position], rank);
      this.hands[position] = remaining;
      this.books[position].push(rank);
    }
    return claimed;
  }

  _refillIfEmpty(position) {
    if (this.hands[position].length === 0 && this.pond.length > 0) {
      this.hands[position].push(this.pond.pop());
    }
  }

  // Salta jogadores que fiquem sem cartas e sem monte para pescar (não têm jogada possível).
  _advanceToPlayableTurn() {
    for (let i = 0; i < this.playerCount; i++) {
      this._refillIfEmpty(this.currentTurn);
      if (this.hands[this.currentTurn].length > 0) return;
      this.currentTurn = (this.currentTurn + 1) % this.playerCount;
    }
  }

  _checkGameOver() {
    const totalBooks = this.books.reduce((sum, b) => sum + b.length, 0);
    if (totalBooks < TOTAL_RANKS) return false;
    this.phase = "round-over";
    const maxBooks = Math.max(...this.books.map((b) => b.length));
    const winners = this.books.map((b, i) => i).filter((i) => this.books[i].length === maxBooks);
    this.outcome = { winners, booksByPosition: this.books.map((b) => b.length) };
    return true;
  }

  ask(position, targetPosition, rank) {
    if (this.phase !== "playing") throw new Error("Jogo não está a decorrer");
    if (this.currentTurn !== position) throw new Error("Não é a tua vez");
    if (
      !Number.isInteger(targetPosition) ||
      targetPosition === position ||
      targetPosition < 0 ||
      targetPosition >= this.playerCount
    ) {
      throw new Error("Alvo inválido");
    }
    if (!RANKS.includes(rank)) throw new Error("Valor inválido");
    if (!this.hands[position].some((c) => c.rank === rank)) {
      throw new Error("Só podes pedir um valor que tenhas na mão");
    }

    const { removed, remaining } = extractRank(this.hands[targetPosition], rank);
    let turnContinues;

    if (removed.length > 0) {
      this.hands[targetPosition] = remaining;
      this.hands[position] = [...this.hands[position], ...removed];
      const claimed = this._claimBooks(position);
      this.lastAction = { type: "catch", position, targetPosition, rank, count: removed.length, claimed };
      turnContinues = true;
    } else {
      const drawn = this.pond.length > 0 ? this.pond.pop() : null;
      if (drawn) this.hands[position].push(drawn);
      const claimed = this._claimBooks(position);
      const matched = !!drawn && drawn.rank === rank;
      this.lastAction = { type: "gofish", position, targetPosition, rank, drawn: matched ? drawn : null, claimed };
      turnContinues = matched;
    }

    if (this._checkGameOver()) return { roundOver: true };

    if (!turnContinues) {
      this.currentTurn = (position + 1) % this.playerCount;
    }
    this._advanceToPlayableTurn();
    return { roundOver: false };
  }

  // { scoreDelta: { p0, p1, ... }, summary } — igual à interface dos outros jogos
  getResult() {
    if (this.phase !== "round-over") return null;
    const scoreDelta = {};
    for (let i = 0; i < this.playerCount; i++) scoreDelta[`p${i}`] = this.books[i].length;
    return { scoreDelta, summary: { ...this.outcome } };
  }

  viewFor(position) {
    return {
      gameType: "peixinho",
      phase: this.phase,
      playerCount: this.playerCount,
      currentTurn: this.currentTurn,
      hand: position != null ? this.hands[position] : [],
      handCounts: this.hands.map((h) => h.length),
      books: this.books,
      pondCount: this.pond.length,
      lastAction: this.lastAction,
      outcome: this.outcome,
    };
  }
}
