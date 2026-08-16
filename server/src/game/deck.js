// Baralho de sueca: 40 cartas (sem 8, 9, 10)
export const SUITS = ["copas", "ouros", "espadas", "paus"];

// Ordem de força, da mais forte para a mais fraca (também define os pontos)
export const RANK_ORDER = ["A", "7", "K", "J", "Q", "6", "5", "4", "3", "2"];

export const RANK_VALUES = {
  A: 11,
  7: 10,
  K: 4,
  J: 3,
  Q: 2,
  6: 0,
  5: 0,
  4: 0,
  3: 0,
  2: 0,
};

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANK_ORDER) {
      deck.push({
        suit,
        rank,
        value: RANK_VALUES[rank],
        strength: RANK_ORDER.indexOf(rank), // 0 = mais forte
        id: `${rank}-${suit}`,
      });
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

export function dealHands(shuffledDeck, dealerPosition) {
  // Distribui em sentido horário a partir de quem está à esquerda do dealer,
  // para que a última carta do baralho caia mesmo na mão do dealer (define o trunfo).
  const hands = [[], [], [], []];
  const order = [];
  for (let i = 1; i <= 4; i++) order.push((dealerPosition + i) % 4);
  // order[3] === dealerPosition (o dealer é o último a receber cada carta)

  for (let i = 0; i < 40; i++) {
    const position = order[i % 4];
    hands[position].push(shuffledDeck[i]);
  }
  const trumpCard = shuffledDeck[39]; // última carta distribuída, vai para o dealer
  return { hands, trumpCard };
}
