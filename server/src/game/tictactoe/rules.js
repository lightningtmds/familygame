// Regras puras do jogo do galo — sem estado.
// Tabuleiro 3x3; board[row][col] é null | 0 | 1 (posição do jogador).

export const SIZE = 3;

const LINES = [
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
];

export function createEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

export function isBoardFull(board) {
  return board.every((row) => row.every((cell) => cell !== null));
}

// Procura uma linha (3 em linha) toda do mesmo dono. Devolve a lista de
// células da linha, ou null se não houver nenhuma.
export function findWinningLine(board, owner) {
  for (const line of LINES) {
    if (line.every(([row, col]) => board[row][col] === owner)) {
      return line.map(([row, col]) => ({ row, col }));
    }
  }
  return null;
}
