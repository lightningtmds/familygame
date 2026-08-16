import { createDominoSet, shuffle, dealDomino, handPips } from "./deck.js";

export class DominoGame {
  constructor(startPosition) {
    this.startPosition = startPosition;
    this.phase = "playing";
    this.consecutivePasses = 0;
    this.outcome = null; // { type: "bateu" | "blocked", winnerPosition, loserPips, tie }

    const set = shuffle(createDominoSet());
    const { hands, boneyard } = dealDomino(set);
    this.hands = hands; // hands[0], hands[1]
    this.boneyard = boneyard;

    // board.sequence guarda as peças já orientadas visualmente da esquerda p/ direita
    this.board = { sequence: [], leftEnd: null, rightEnd: null };
    this.currentTurn = startPosition;
  }

  opponent(position) {
    return position === 0 ? 1 : 0;
  }

  pieceMatchesBoard(piece) {
    if (this.board.sequence.length === 0) return { left: true, right: true };
    return {
      left: piece.a === this.board.leftEnd || piece.b === this.board.leftEnd,
      right: piece.a === this.board.rightEnd || piece.b === this.board.rightEnd,
    };
  }

  canPlayAny(position) {
    return this.hands[position].some((piece) => {
      const m = this.pieceMatchesBoard(piece);
      return m.left || m.right;
    });
  }

  boneyardEmpty() {
    return this.boneyard.length === 0;
  }

  playPiece(position, pieceId, side) {
    if (this.phase !== "playing") throw new Error("Jogo não está a decorrer");
    if (this.currentTurn !== position) throw new Error("Não é a tua vez");

    const hand = this.hands[position];
    const piece = hand.find((p) => p.id === pieceId);
    if (!piece) throw new Error("Não tens essa peça");

    if (this.board.sequence.length === 0) {
      this.board.sequence.push({ a: piece.a, b: piece.b });
      this.board.leftEnd = piece.a;
      this.board.rightEnd = piece.b;
    } else {
      const m = this.pieceMatchesBoard(piece);
      const chosenSide = side === "left" ? "left" : "right";
      if (!m[chosenSide]) {
        throw new Error(`Essa peça não encaixa do lado ${chosenSide === "left" ? "esquerdo" : "direito"}`);
      }
      if (chosenSide === "left") {
        const matchedValue = this.board.leftEnd;
        const exposed = piece.a === matchedValue ? piece.b : piece.a;
        this.board.sequence.unshift({ a: exposed, b: matchedValue });
        this.board.leftEnd = exposed;
      } else {
        const matchedValue = this.board.rightEnd;
        const exposed = piece.a === matchedValue ? piece.b : piece.a;
        this.board.sequence.push({ a: matchedValue, b: exposed });
        this.board.rightEnd = exposed;
      }
    }

    this.hands[position] = hand.filter((p) => p.id !== pieceId);
    this.consecutivePasses = 0;

    if (this.hands[position].length === 0) {
      this.phase = "round-over";
      this.outcome = { type: "bateu", winnerPosition: position, tie: false };
      return { roundOver: true };
    }

    this.currentTurn = this.opponent(position);
    return { roundOver: false };
  }

  drawTile(position) {
    if (this.phase !== "playing") throw new Error("Jogo não está a decorrer");
    if (this.currentTurn !== position) throw new Error("Não é a tua vez");
    if (this.canPlayAny(position)) throw new Error("Já tens jogada disponível, não precisas de comprar");
    if (this.boneyardEmpty()) throw new Error("O monte está vazio");

    const tile = this.boneyard.pop();
    this.hands[position].push(tile);

    const nowPlayable = this.canPlayAny(position);
    if (!nowPlayable && this.boneyardEmpty()) {
      return this._forcePass(position);
    }
    return { drew: tile, canPlayNow: nowPlayable, roundOver: false };
  }

  passTurn(position) {
    if (this.phase !== "playing") throw new Error("Jogo não está a decorrer");
    if (this.currentTurn !== position) throw new Error("Não é a tua vez");
    if (this.canPlayAny(position)) throw new Error("Tens jogada disponível, não podes passar");
    if (!this.boneyardEmpty()) throw new Error("Tens de comprar do monte antes de passar");
    return this._forcePass(position);
  }

  _forcePass(position) {
    this.consecutivePasses += 1;
    if (this.consecutivePasses >= 2) {
      this.phase = "round-over";
      const pipsA = handPips(this.hands[0]);
      const pipsB = handPips(this.hands[1]);
      if (pipsA === pipsB) {
        this.outcome = { type: "blocked", tie: true };
      } else {
        const winnerPosition = pipsA < pipsB ? 0 : 1;
        this.outcome = { type: "blocked", winnerPosition, tie: false };
      }
      return { roundOver: true, blocked: true };
    }
    this.currentTurn = this.opponent(position);
    return { roundOver: false, passed: true };
  }

  // { scoreDelta: { p0, p1 }, summary }
  getResult() {
    if (this.phase !== "round-over") return null;
    const scoreDelta = { p0: 0, p1: 0 };
    if (this.outcome.tie) {
      return { scoreDelta, summary: { type: "blocked", tie: true } };
    }
    const winner = this.outcome.winnerPosition;
    const loser = this.opponent(winner);
    const loserPips = handPips(this.hands[loser]);
    scoreDelta[`p${winner}`] = loserPips;
    return {
      scoreDelta,
      summary: { type: this.outcome.type, winnerPosition: winner, pointsWon: loserPips, tie: false },
    };
  }

  viewFor(position) {
    return {
      gameType: "domino",
      phase: this.phase,
      startPosition: this.startPosition,
      currentTurn: this.currentTurn,
      board: this.board,
      hand: position != null ? this.hands[position] : [],
      handCounts: this.hands.map((h) => h.length),
      boneyardCount: this.boneyard.length,
      canPlay: this.phase === "playing" && this.currentTurn === position && this.canPlayAny(position),
      canDraw:
        this.phase === "playing" &&
        this.currentTurn === position &&
        !this.canPlayAny(position) &&
        !this.boneyardEmpty(),
      canPass:
        this.phase === "playing" &&
        this.currentTurn === position &&
        !this.canPlayAny(position) &&
        this.boneyardEmpty(),
      outcome: this.outcome,
    };
  }
}
