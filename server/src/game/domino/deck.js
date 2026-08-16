// Conjunto standard de dominó "double-six": 28 peças, 0-0 até 6-6.

export function createDominoSet() {
  const pieces = [];
  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) {
      pieces.push({ id: `${a}-${b}`, a, b, pips: a + b });
    }
  }
  return pieces;
}

export function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function dealDomino(shuffledSet) {
  const hands = [shuffledSet.slice(0, 7), shuffledSet.slice(7, 14)];
  const boneyard = shuffledSet.slice(14);
  return { hands, boneyard };
}

export function handPips(hand) {
  return hand.reduce((sum, p) => sum + p.pips, 0);
}
