// Regras puras de sueca — sem estado, fáceis de testar isoladamente.

/**
 * Verifica se uma jogada é válida: tem de seguir o naipe pedido se o jogador
 * tiver alguma carta desse naipe na mão. Caso contrário, pode jogar qualquer carta.
 */
export function isValidMove(hand, card, ledSuit) {
  if (!ledSuit) return true; // primeira carta da vaza, qualquer uma serve
  const hasLedSuit = hand.some((c) => c.suit === ledSuit);
  if (!hasLedSuit) return true; // não tem o naipe, pode jogar o que quiser
  return card.suit === ledSuit;
}

/**
 * Recebe a vaza atual: [{ position, card }, ...] (4 entradas) e o naipe de trunfo.
 * Devolve a posição vencedora.
 */
export function resolveTrick(trick, trump) {
  const ledSuit = trick[0].card.suit;
  const trumpPlays = trick.filter((p) => p.card.suit === trump);

  const pool = trumpPlays.length > 0
    ? trumpPlays
    : trick.filter((p) => p.card.suit === ledSuit);

  // menor "strength" = carta mais forte (ver RANK_ORDER)
  return pool.reduce((best, cur) =>
    cur.card.strength < best.card.strength ? cur : best
  ).position;
}

export function trickPoints(trick) {
  return trick.reduce((sum, p) => sum + p.card.value, 0);
}
