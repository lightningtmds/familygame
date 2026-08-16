const ROWS = 6;
const COLS = 7;

export default function Connect4Board({ state, myPosition, isSpectator, players, sessionScore, onDrop, roundOverInfo, onNewRound, readyCount }) {
  const isMyTurn = !isSpectator && state.currentTurn === myPosition;
  const opponent = isSpectator ? null : players.find((p) => p.position !== myPosition);
  const playerZero = players.find((p) => p.position === 0);
  const playerOne = players.find((p) => p.position === 1);

  const summary = roundOverInfo?.summary;
  const winLine = summary?.type === "win" ? summary.line : null;
  const isWinCell = (row, col) => winLine?.some((c) => c.row === row && c.col === col);

  const columnFull = (col) => state.board[0][col] !== null;

  const nameAt = (pos) => (pos === 0 ? playerZero?.name : playerOne?.name);
  const winnerName = summary?.type === "win"
    ? isSpectator ? nameAt(summary.winnerPosition) : summary.winnerPosition === myPosition ? "Tu" : opponent?.name
    : null;

  return (
    <div className="sc-table c4-table">
      {isSpectator && <div className="sc-spectator-banner">A assistir</div>}
      <header className="sc-hud">
        <div className="sc-trump">
          <span className="sc-hud-label">Vez de</span>
          <span className="sc-trump-value">{nameAt(state.currentTurn) ?? "..."}</span>
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

      <div className="c4-board">
        {Array.from({ length: COLS }).map((_, col) => (
          <button
            key={col}
            className="c4-column"
            onClick={() => onDrop(col)}
            disabled={!isMyTurn || columnFull(col)}
            aria-label={`Jogar na coluna ${col + 1}`}
          >
            {Array.from({ length: ROWS }).map((_, row) => {
              const owner = state.board[row][col];
              const classes = ["c4-cell"];
              if (owner === 0) classes.push("c4-cell-p0");
              if (owner === 1) classes.push("c4-cell-p1");
              if (isWinCell(row, col)) classes.push("c4-cell-win");
              return <span key={row} className={classes.join(" ")} />;
            })}
          </button>
        ))}
      </div>

      <footer className="sc-my-hand-area">
        {isSpectator ? (
          <p className="sc-turn-indicator">Vez de {nameAt(state.currentTurn)}</p>
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
            <p>{summary.type === "win" ? `${winnerName} venceu!` : "Empate — tabuleiro cheio."}</p>
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
