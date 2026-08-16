import { useState, useEffect } from "react";
import Card from "./Card.jsx";

const RANK_LABEL = {
  A: "Ases",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  J: "Valetes",
  Q: "Damas",
  K: "Reis",
};

export default function PeixinhoTable({ state, myPosition, isSpectator, players, sessionScore, onAsk, roundOverInfo, onNewRound, readyCount }) {
  const [selectedTarget, setSelectedTarget] = useState(null);

  useEffect(() => setSelectedTarget(null), [state.currentTurn]);

  const isMyTurn = !isSpectator && state.currentTurn === myPosition;
  const nameAt = (pos) => players.find((p) => p.position === pos)?.name ?? `Jogador ${pos}`;

  const handleCardClick = (card) => {
    if (!isMyTurn || selectedTarget == null) return;
    onAsk(selectedTarget, card.rank);
    setSelectedTarget(null);
  };

  const summary = roundOverInfo?.summary;
  const action = state.lastAction;

  return (
    <div className="sc-table pk-table">
      {isSpectator && <div className="sc-spectator-banner">A assistir</div>}
      <header className="sc-hud">
        <div className="sc-trump">
          <span className="sc-hud-label">Monte</span>
          <span className="sc-trump-value">{state.pondCount} cartas</span>
        </div>
        <div className="sc-trump">
          <span className="sc-hud-label">Vez de</span>
          <span className="sc-trump-value">{nameAt(state.currentTurn)}</span>
        </div>
      </header>

      <p className="pk-last-action">
        {action &&
          (action.type === "catch"
            ? `${nameAt(action.position)} pediu ${RANK_LABEL[action.rank]} a ${nameAt(action.targetPosition)} e apanhou ${action.count}!`
            : action.drawn
              ? `${nameAt(action.position)} foi pescar e tirou mesmo ${RANK_LABEL[action.rank]}!`
              : `${nameAt(action.position)} pediu ${RANK_LABEL[action.rank]} a ${nameAt(action.targetPosition)} — foi pescar.`)}
        {action?.claimed?.length > 0 && ` 🐟 Peixinho de ${action.claimed.map((r) => RANK_LABEL[r]).join(", ")}!`}
      </p>

      <div className="pk-opponents">
        {players
          .filter((p) => p.position !== myPosition)
          .sort((a, b) => a.position - b.position)
          .map((p) => (
            <button
              key={p.position}
              className={`pk-opponent ${selectedTarget === p.position ? "pk-opponent-selected" : ""}`}
              onClick={() => setSelectedTarget(selectedTarget === p.position ? null : p.position)}
              disabled={isSpectator || !isMyTurn}
            >
              <span className="pk-opponent-name">
                {p.name}
                {state.currentTurn === p.position ? " 👉" : ""}
              </span>
              <span className="pk-opponent-meta">
                {state.handCounts[p.position]} cartas · {state.books[p.position].length} 🐟
              </span>
            </button>
          ))}
      </div>

      <footer className="sc-my-hand-area">
        {isSpectator ? (
          <p className="sc-turn-indicator">Vez de {nameAt(state.currentTurn)}</p>
        ) : (
          <>
            <p className={`sc-turn-indicator ${isMyTurn ? "sc-turn-active" : ""}`}>
              {isMyTurn
                ? selectedTarget == null
                  ? "Escolhe a quem perguntar"
                  : `A perguntar a ${nameAt(selectedTarget)} — escolhe o valor`
                : `Vez de ${nameAt(state.currentTurn)}`}
            </p>
            {state.books[myPosition]?.length > 0 && (
              <div className="pk-my-books">
                {state.books[myPosition].map((rank) => (
                  <span key={rank} className="pk-book-chip">
                    {RANK_LABEL[rank]}
                  </span>
                ))}
              </div>
            )}
            <div className="sc-my-hand">
              {state.hand.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  onClick={() => handleCardClick(card)}
                  disabled={!isMyTurn || selectedTarget == null}
                />
              ))}
            </div>
          </>
        )}
      </footer>

      {roundOverInfo && summary && (
        <div className="sc-modal-backdrop">
          <div className="sc-modal">
            <h2>Fim do jogo</h2>
            <p>
              {summary.winners.length > 1
                ? `Empate entre ${summary.winners.map(nameAt).join(" e ")}!`
                : `${nameAt(summary.winners[0])} venceu!`}
            </p>
            <ul className="pk-final-scores">
              {players.map((p) => (
                <li key={p.position}>
                  {p.name}: {summary.booksByPosition[p.position]} 🐟
                </li>
              ))}
            </ul>
            <p className="sc-subtitle">
              Sessão — {players.map((p) => `${p.name}: ${sessionScore[`p${p.position}`] ?? 0}`).join(" · ")}
            </p>
            {!isSpectator && (
              <button className="sc-btn-primary" onClick={onNewRound}>
                Jogar outra vez ({readyCount}/{players.length})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
