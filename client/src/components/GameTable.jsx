import Card from "./Card.jsx";

const SUIT_LABEL = {
  copas: "Copas ♥",
  ouros: "Ouros ♦",
  espadas: "Espadas ♠",
  paus: "Paus ♣",
};

// Roda as posições para que o próprio jogador fique sempre em baixo.
// Para espectadores, usa-se uma posição de referência fixa (0) — vêem a mesa
// sempre com a mesma orientação, não centrada em nenhum jogador específico.
// relative: 0 = baixo, 1 = esquerda, 2 = cima, 3 = direita
function relativePosition(position, refPosition) {
  return (position - refPosition + 4) % 4;
}

export default function GameTable({ state, myPosition, isSpectator, players, sessionScore, onPlayCard, roundOverInfo, onNewRound, readyCount }) {
  const refPosition = isSpectator ? 0 : myPosition;

  const trickByRelative = {};
  for (const play of state.currentTrick) {
    trickByRelative[relativePosition(play.position, refPosition)] = play;
  }

  const playerAt = (relPos) => {
    const actualPos = (refPosition + relPos) % 4;
    return players.find((p) => p.position === actualPos);
  };

  const isMyTurn = !isSpectator && state.currentTurn === myPosition;
  const ledSuit = state.currentTrick.length > 0 ? state.currentTrick[0].card.suit : null;
  const myHasLedSuit = ledSuit ? state.hand.some((c) => c.suit === ledSuit) : false;

  const cardIsPlayable = (card) => {
    if (!isMyTurn) return false;
    if (!ledSuit) return true;
    if (!myHasLedSuit) return true;
    return card.suit === ledSuit;
  };

  const roundScore = roundOverInfo?.summary?.roundScore;

  return (
    <div className="sc-table">
      {isSpectator && <div className="sc-spectator-banner">A assistir</div>}
      <header className="sc-hud">
        <div className="sc-trump">
          <span className="sc-hud-label">Trunfo</span>
          <span className="sc-trump-value">{SUIT_LABEL[state.trump]}</span>
        </div>
        <div className="sc-scores">
          <div className="sc-score sc-score-a">
            <span className="sc-hud-label">Equipa A</span>
            <strong>{state.roundScore.team1}</strong>
            <span className="sc-session">sessão: {sessionScore.team1 ?? 0}</span>
          </div>
          <div className="sc-score sc-score-b">
            <span className="sc-hud-label">Equipa B</span>
            <strong>{state.roundScore.team2}</strong>
            <span className="sc-session">sessão: {sessionScore.team2 ?? 0}</span>
          </div>
        </div>
        <div className="sc-trick-count">
          <span className="sc-hud-label">Vazas</span>
          <strong>{state.tricksPlayed}/10</strong>
        </div>
      </header>

      <div className="sc-felt">
        {/* Cima */}
        <div className="sc-seat sc-seat-top">
          <div className="sc-seat-name">{playerAt(2)?.name ?? "—"}</div>
          <div className="sc-opponent-hand">
            {Array.from({ length: state.handCounts[(refPosition + 2) % 4] }).map((_, i) => (
              <Card key={i} faceDown small />
            ))}
          </div>
        </div>

        <div className="sc-mid-row">
          {/* Esquerda */}
          <div className="sc-seat sc-seat-left">
            <div className="sc-seat-name">{playerAt(1)?.name ?? "—"}</div>
            <div className="sc-opponent-hand sc-opponent-hand-vertical">
              {Array.from({ length: state.handCounts[(refPosition + 1) % 4] }).map((_, i) => (
                <Card key={i} faceDown small />
              ))}
            </div>
          </div>

          {/* Vaza central */}
          <div className="sc-trick-area">
            {[2, 1, 0, 3].map((rel) => {
              const play = trickByRelative[rel];
              return (
                <div key={rel} className={`sc-trick-slot sc-trick-slot-${rel}`}>
                  {play && <Card card={play.card} small disabled />}
                </div>
              );
            })}
            {state.currentTrick.length === 0 && state.lastTrick && (
              <p className="sc-last-trick-note">
                Última vaza: {playerAt(relativePosition(state.lastTrick.winnerPosition, refPosition))?.name} (+{state.lastTrick.points} pts)
              </p>
            )}
          </div>

          {/* Direita */}
          <div className="sc-seat sc-seat-right">
            <div className="sc-seat-name">{playerAt(3)?.name ?? "—"}</div>
            <div className="sc-opponent-hand sc-opponent-hand-vertical">
              {Array.from({ length: state.handCounts[(refPosition + 3) % 4] }).map((_, i) => (
                <Card key={i} faceDown small />
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="sc-my-hand-area">
        {isSpectator ? (
          <p className="sc-turn-indicator">Vez de {playerAt(relativePosition(state.currentTurn, refPosition))?.name ?? "..."}</p>
        ) : (
          <>
            <p className={`sc-turn-indicator ${isMyTurn ? "sc-turn-active" : ""}`}>
              {isMyTurn ? "É a tua vez" : `Vez de ${playerAt(relativePosition(state.currentTurn, refPosition))?.name ?? "..."}`}
            </p>
            <div className="sc-my-hand">
              {state.hand.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  onClick={() => onPlayCard(card.id)}
                  disabled={!cardIsPlayable(card)}
                />
              ))}
            </div>
          </>
        )}
      </footer>

      {roundOverInfo && roundScore && (
        <div className="sc-modal-backdrop">
          <div className="sc-modal">
            <h2>Fim da partida</h2>
            <p>Equipa A: {roundScore.team1} pontos</p>
            <p>Equipa B: {roundScore.team2} pontos</p>
            <p className="sc-subtitle">
              Placar de sessão — A: {roundOverInfo.sessionScore.team1 ?? 0} · B: {roundOverInfo.sessionScore.team2 ?? 0}
            </p>
            {!isSpectator && (
              <button className="sc-btn-primary" onClick={onNewRound}>
                Jogar outra partida ({readyCount}/4)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
