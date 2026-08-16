// Baralho standard de 52 cartas (com 8, 9, 10) para o jogo do Peixinho.
export const SUITS = ["copas", "ouros", "espadas", "paus"];
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${rank}-${suit}` });
    }
  }
  return deck;
}

export function shuffle(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function handSizeFor(playerCount) {
  return playerCount <= 3 ? 7 : 5;
}

export function dealHands(shuffledDeck, playerCount) {
  const size = handSizeFor(playerCount);
  const hands = [];
  let idx = 0;
  for (let p = 0; p < playerCount; p++) {
    hands.push(shuffledDeck.slice(idx, idx + size));
    idx += size;
  }
  const pond = shuffledDeck.slice(idx);
  return { hands, pond };
}
