import { useEffect, useState } from "react";

const REASON_LABEL = {
  "sem-pecas": "ficou sem peças",
  "sem-jogadas": "ficou sem jogadas possíveis",
};

// Roda o tabuleiro 180º para quem está na posição 0, para que cada jogador
// veja sempre as suas próprias peças em baixo. A paridade das casas escuras
// mantém-se (rotação de 180º preserva (row+col) % 2).
function toActual(displayRow, displayCol, flip) {
  return flip ? { row: 7 - displayRow, col: 7 - displayCol } : { row: displayRow, col: displayCol };
}

export default function CheckersBoard({ state, myPosition, isSpectator, players, sessionScore, onMove, roundOverInfo, onNewRound, readyCount }) {
  const [selected, setSelected] = useState(null);

  useEffect(() => setSelected(null), [state.currentTurn]);

  const flip = !isSpectator && myPosition === 0;
  const isMyTurn = !isSpectator && state.currentTurn === myPosition;
  const active = state.forcedOrigin && isMyTurn ? state.forcedOrigin : selected;
  const activeOptions = active ? state.legalMoves[`${active.row},${active.col}`] ?? [] : [];

  const playerZero = players.find((p) => p.position === 0);
  const playerOne = players.find((p) => p.position === 1);
  const opponent = isSpectator ? null : players.find((p) => p.position !== myPosition);

  const handleSquareClick = (row, col) => {
    if (!isMyTurn) return;
    const key = `${row},${col}`;

    if (active) {
      const dest = activeOptions.find((o) => o.to.row === row && o.to.col === col);
      if (dest) {
        onMove({ row: active.row, col: active.col }, { row, col });
        setSelected(null);
        return;
      }
    }

    if (state.forcedOrigin) return; // a meio de captura obrigatória, não se pode trocar de peça
    if (state.legalMoves[key]) {
      setSelected(selected && selected.row === row && selected.col === col ? null : { row, col });
    } else {
      setSelected(null);
    }
  };

  const summary = roundOverInfo?.summary;
  const nameAt = (pos) => (pos === 0 ? playerZero?.name : playerOne?.name);
  const winnerName = summary ? (isSpectator ? nameAt(summary.winnerPosition) : summary.winnerPosition === myPosition ? "Tu" : opponent?.name) : null;
  const loserPosition = summary ? (summary.winnerPosition === 0 ? 1 : 0) : null;
  const loserName = summary ? (isSpectator ? nameAt(loserPosition) : loserPosition === myPosition ? "tu" : opponent?.name) : null;

  return (
    <div className="sc-table ck-table">
      {isSpectator && <div className="sc-spectator-banner">A assistir</div>}
      <header className="sc-hud">
        <div className="sc-trump">
          <span className="sc-hud-label">Vez de</span>
          <span className="sc-trump-value">
            {(state.currentTurn === 0 ? playerZero?.name : playerOne?.name) ?? "..."}
          </span>
        </div>
        <div className="sc-scores">
          <div className="sc-score sc-score-a">
            <span className="sc-hud-label">{playerZero?.name ?? "Jogador 0"}</span>
            <strong>{sessionScore.p0 ?? 0}</strong>
          </div>
          <div className="sc-score sc-score-b">
            <span className="sc-hud-label">{playerOne?.name ?? "Jogador 1"}</span>
            <strong>{sessionScore.p1 ?? 0}</strong>
          </div>
        </div>
      </header>

      {isMyTurn && state.mustCapture && <div className="ck-badge-capture">Captura obrigatória</div>}

      <div className="ck-board">
        {Array.from({ length: 8 }).map((_, displayRow) =>
          Array.from({ length: 8 }).map((_, displayCol) => {
            const { row, col } = toActual(displayRow, displayCol, flip);
            const isDark = (row + col) % 2 === 1;
            const piece = state.board[row][col];
            const key = `${row},${col}`;
            const isSelected = active && active.row === row && active.col === col;
            const dest = isDark ? activeOptions.find((o) => o.to.row === row && o.to.col === col) : null;

            const classes = ["ck-square", isDark ? "ck-square-dark" : "ck-square-light"];
            if (isSelected) classes.push("ck-square-selected");
            if (dest) classes.push(dest.captured ? "ck-square-destination-capture" : "ck-square-destination");

            if (!isDark) {
              return <div key={key} className={classes.join(" ")} />;
            }

            return (
              <button
                key={key}
                className={classes.join(" ")}
                onClick={() => handleSquareClick(row, col)}
                disabled={!isMyTurn}
                aria-label={`Casa ${row},${col}`}
              >
                {piece && (
                  <span className={`ck-piece ck-piece-p${piece.owner} ${piece.king ? "ck-piece-king" : ""}`} />
                )}
              </button>
            );
          })
        )}
      </div>

      <footer className="sc-my-hand-area">
        {isSpectator ? (
          <p className="sc-turn-indicator">Vez de {state.currentTurn === 0 ? playerZero?.name : playerOne?.name}</p>
        ) : (
          <p className={`sc-turn-indicator ${isMyTurn ? "sc-turn-active" : ""}`}>
            {isMyTurn ? "É a tua vez" : `Vez de ${opponent?.name ?? "..."}`}
          </p>
        )}
      </footer>

      {roundOverInfo && summary && (
        <div className="sc-modal-backdrop">
          <div className="sc-modal">
            <h2>Fim do jogo</h2>
            <p>
              {winnerName} venceu — {loserName} {REASON_LABEL[summary.reason]}
            </p>
            <p className="sc-subtitle">
              Sessão — {playerZero?.name ?? "Jogador 0"}: {roundOverInfo.sessionScore.p0 ?? 0} ·{" "}
              {playerOne?.name ?? "Jogador 1"}: {roundOverInfo.sessionScore.p1 ?? 0}
            </p>
            {!isSpectator && (
              <button className="sc-btn-primary" onClick={onNewRound}>
                Jogar outra vez ({readyCount}/2)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
