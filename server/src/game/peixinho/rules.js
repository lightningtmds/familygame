// Regras puras do Peixinho ("Go Fish") — sem estado.
import { RANKS } from "./deck.js";

export { RANKS };

// Remove todas as cartas de `rank` da mão. Devolve as removidas e o resto.
export function extractRank(hand, rank) {
  const removed = hand.filter((c) => c.rank === rank);
  const remaining = hand.filter((c) => c.rank !== rank);
  return { removed, remaining };
}

// Devolve os valores (ranks) para os quais a mão já tem as 4 cartas — um "peixinho".
export function findCompletedRanks(hand) {
  const counts = {};
  for (const card of hand) counts[card.rank] = (counts[card.rank] || 0) + 1;
  return RANKS.filter((rank) => counts[rank] === 4);
}
