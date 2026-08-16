import { createDeck, shuffle, dealHands } from "./deck.js";
import { isValidMove, resolveTrick, trickPoints } from "./rules.js";

// Posições 0 e 2 são a equipa "team1" (ex: Norte/Sul), 1 e 3 são "team2" (Este/Oeste)
const TEAM_OF = { 0: "team1", 1: "team2", 2: "team1", 3: "team2" };

export class Game {
  constructor(dealerPosition) {
    this.dealerPosition = dealerPosition;
    this.phase = "dealing";
    this.roundScore = { team1: 0, team2: 0 };
    this.currentTrick = []; // [{ position, card }]
    this.tricksPlayed = 0;
    this.lastTrick = null; // { winnerPosition, cards, points } — para mostrar brevemente

    const deck = shuffle(createDeck());
    const { hands, trumpCard } = dealHands(deck, dealerPosition);
    this.hands = hands; // hands[position] = Card[]
    this.trump = trumpCard.suit;
    this.trumpCard = trumpCard;

    this.currentTurn = (dealerPosition + 1) % 4; // começa quem está à esquerda do dealer
    this.phase = "playing";
  }

  getLedSuit() {
    return this.currentTrick.length > 0 ? this.currentTrick[0].card.suit : null;
  }

  canPlay(position, card) {
    if (this.phase !== "playing") return { ok: false, reason: "Jogo não está a decorrer" };
    if (this.currentTurn !== position) return { ok: false, reason: "Não é a tua vez" };

    const hand = this.hands[position];
    const inHand = hand.find((c) => c.id === card.id);
    if (!inHand) return { ok: false, reason: "Não tens essa carta" };

    const ledSuit = this.getLedSuit();
    if (!isValidMove(hand, inHand, ledSuit)) {
      return { ok: false, reason: `Tens de jogar naipe ${ledSuit}` };
    }
    return { ok: true, card: inHand };
  }

  /**
   * Joga uma carta. Devolve informação sobre o que aconteceu para o caller
   * decidir o que fazer a seguir (emitir eventos, fechar vaza, terminar jogo...).
   */
  playCard(position, cardId) {
    const hand = this.hands[position];
    const card = hand.find((c) => c.id === cardId);
    const check = this.canPlay(position, card);
    if (!check.ok) throw new Error(check.reason);

    // remove da mão, adiciona à vaza
    this.hands[position] = hand.filter((c) => c.id !== cardId);
    this.currentTrick.push({ position, card });

    if (this.currentTrick.length < 4) {
      this.currentTurn = (this.currentTurn + 1) % 4;
      return { trickComplete: false };
    }

    // vaza completa: resolve
    const winnerPosition = resolveTrick(this.currentTrick, this.trump);
    const points = trickPoints(this.currentTrick);
    const winningTeam = TEAM_OF[winnerPosition];
    this.roundScore[winningTeam] += points;

    this.lastTrick = {
      cards: this.currentTrick,
      winnerPosition,
      points,
    };
    this.tricksPlayed += 1;
    this.currentTrick = [];
    this.currentTurn = winnerPosition;

    const roundOver = this.tricksPlayed === 10;
    if (roundOver) this.phase = "round-over";

    return { trickComplete: true, winnerPosition, points, roundOver };
  }

  // Interface genérica usada pela Room (igual à do DominoGame)
  getResult() {
    if (this.phase !== "round-over") return null;
    return {
      scoreDelta: { team1: this.roundScore.team1, team2: this.roundScore.team2 },
      summary: { type: "vazas", roundScore: { ...this.roundScore } },
    };
  }

  // Estado público para um jogador específico: não revela mãos alheias
  viewFor(position) {
    return {
      gameType: "sueca",
      phase: this.phase,
      dealerPosition: this.dealerPosition,
      trump: this.trump,
      trumpCard: this.trumpCard,
      currentTurn: this.currentTurn,
      currentTrick: this.currentTrick,
      lastTrick: this.lastTrick,
      tricksPlayed: this.tricksPlayed,
      roundScore: this.roundScore,
      hand: position != null ? this.hands[position] : [],
      handCounts: this.hands.map((h) => h.length),
    };
  }
}

export { TEAM_OF };
