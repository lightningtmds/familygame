// Regras puras de Quatro em Linha — sem estado.
// Tabuleiro 6 linhas x 7 colunas; board[row][col] é null | 0 | 1 (posição do
// jogador). row 0 é o topo, row 5 é o fundo (onde as peças "caem").

export const ROWS = 6;
export const COLS = 7;

const DIRECTIONS = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal \
  [1, -1], // diagonal /
];

export function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function inBounds(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

// Devolve a linha (row) onde a peça cai nessa coluna, ou -1 se estiver cheia.
export function dropRow(board, col) {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) return row;
  }
  return -1;
}

export function isBoardFull(board) {
  return board[0].every((cell) => cell !== null);
}

// Procura uma sequência de 4+ peças do mesmo dono que passe por (row,col).
// Devolve a lista de células da sequência, ou null se não houver.
export function findWinningLine(board, row, col, owner) {
  for (const [dr, dc] of DIRECTIONS) {
    const cells = [{ row, col }];

    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c) && board[r][c] === owner) {
      cells.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    r = row - dr;
    c = col - dc;
    while (inBounds(r, c) && board[r][c] === owner) {
      cells.unshift({ row: r, col: c });
      r -= dr;
      c -= dc;
    }

    if (cells.length >= 4) return cells;
  }
  return null;
}
