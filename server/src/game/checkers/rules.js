// Regras puras de damas (variante portuguesa/brasileira) — sem estado.
// Tabuleiro 8x8, casas jogáveis onde (row + col) é ímpar.
// Peças normais capturam nas 4 direções diagonais; dama "voa" (anda e
// captura à distância). Captura obrigatória com regra de maioria: só são
// legais as sequências que capturam o máximo de peças possível no turno.

const DIAGONALS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

export function inBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

export function isPromotionRow(row, owner) {
  return owner === 0 ? row === 7 : row === 0;
}

export function squareKey(row, col) {
  return `${row},${col}`;
}

export function createInitialBoard() {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) board[row][col] = { owner: 0, king: false };
    }
  }
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) board[row][col] = { owner: 1, king: false };
    }
  }
  return board;
}

function cloneBoard(board) {
  return board.map((row) => row.slice());
}

function applyHop(board, row, col, hop) {
  const next = cloneBoard(board);
  const piece = next[row][col];
  next[row][col] = null;
  if (hop.captured) next[hop.captured.row][hop.captured.col] = null;
  next[hop.to.row][hop.to.col] = piece;
  return next;
}

function generateSimpleMoves(board, row, col) {
  const piece = board[row][col];
  const moves = [];
  if (piece.king) {
    for (const [dr, dc] of DIAGONALS) {
      let r = row + dr;
      let c = col + dc;
      while (inBounds(r, c) && !board[r][c]) {
        moves.push({ row: r, col: c });
        r += dr;
        c += dc;
      }
    }
  } else {
    const dirs = piece.owner === 0 ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
    for (const [dr, dc] of dirs) {
      const r = row + dr;
      const c = col + dc;
      if (inBounds(r, c) && !board[r][c]) moves.push({ row: r, col: c });
    }
  }
  return moves;
}

function generateCaptureHops(board, row, col) {
  const piece = board[row][col];
  const hops = [];

  if (piece.king) {
    for (const [dr, dc] of DIAGONALS) {
      let r = row + dr;
      let c = col + dc;
      while (inBounds(r, c) && !board[r][c]) {
        r += dr;
        c += dc;
      }
      if (inBounds(r, c) && board[r][c] && board[r][c].owner !== piece.owner) {
        const captured = { row: r, col: c };
        let lr = r + dr;
        let lc = c + dc;
        while (inBounds(lr, lc) && !board[lr][lc]) {
          hops.push({ to: { row: lr, col: lc }, captured });
          lr += dr;
          lc += dc;
        }
      }
    }
  } else {
    for (const [dr, dc] of DIAGONALS) {
      const mr = row + dr;
      const mc = col + dc;
      const lr = row + 2 * dr;
      const lc = col + 2 * dc;
      if (
        inBounds(mr, mc) &&
        inBounds(lr, lc) &&
        board[mr][mc] &&
        board[mr][mc].owner !== piece.owner &&
        !board[lr][lc]
      ) {
        hops.push({ to: { row: lr, col: lc }, captured: { row: mr, col: mc } });
      }
    }
  }

  return hops;
}

// Valor total de peças capturadas se este hop for jogado (considerando que
// promoção termina a sequência de captura imediatamente).
function hopValue(board, row, col, hop) {
  const piece = board[row][col];
  const promotes = !piece.king && isPromotionRow(hop.to.row, piece.owner);
  if (promotes) return 1;
  const next = applyHop(board, row, col, hop);
  return 1 + maxCaptureFrom(next, hop.to.row, hop.to.col);
}

export function maxCaptureFrom(board, row, col) {
  const hops = generateCaptureHops(board, row, col);
  if (hops.length === 0) return 0;
  return Math.max(...hops.map((h) => hopValue(board, row, col, h)));
}

function filterMaximalHops(board, row, col) {
  const hops = generateCaptureHops(board, row, col);
  if (hops.length === 0) return [];
  const values = hops.map((h) => hopValue(board, row, col, h));
  const max = Math.max(...values);
  return hops.filter((_, i) => values[i] === max);
}

/**
 * Calcula as jogadas legais para `position`.
 * - forcedOrigin: quando não-nulo, estamos a meio de uma sequência de
 *   captura — só essa peça pode jogar, e tem de continuar a capturar.
 * Devolve { mustCapture, movesByOrigin } onde movesByOrigin mapeia
 * "row,col" -> [{ to: {row,col}, captured?: {row,col} }, ...]
 */
export function computeLegalMoves(board, position, forcedOrigin = null) {
  if (forcedOrigin) {
    const { row, col } = forcedOrigin;
    const hops = filterMaximalHops(board, row, col);
    if (hops.length === 0) return { mustCapture: false, movesByOrigin: {} };
    return { mustCapture: true, movesByOrigin: { [squareKey(row, col)]: hops } };
  }

  const piecesOf = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.owner === position) piecesOf.push({ row, col });
    }
  }

  const captureInfo = piecesOf.map(({ row, col }) => ({ row, col, value: maxCaptureFrom(board, row, col) }));
  const globalMax = Math.max(0, ...captureInfo.map((c) => c.value));

  const movesByOrigin = {};
  if (globalMax > 0) {
    for (const { row, col, value } of captureInfo) {
      if (value === globalMax) {
        movesByOrigin[squareKey(row, col)] = filterMaximalHops(board, row, col);
      }
    }
    return { mustCapture: true, movesByOrigin };
  }

  for (const { row, col } of piecesOf) {
    const simple = generateSimpleMoves(board, row, col).map((to) => ({ to }));
    if (simple.length) movesByOrigin[squareKey(row, col)] = simple;
  }
  return { mustCapture: false, movesByOrigin };
}
