import { useState, useEffect } from "react";
import DominoPiece from "./DominoPiece.jsx";

function pieceMatches(piece, board) {
  if (board.sequence.length === 0) return { left: true, right: true };
  return {
    left: piece.a === board.leftEnd || piece.b === board.leftEnd,
    right: piece.a === board.rightEnd || piece.b === board.rightEnd,
  };
}

export default function DominoTable({ state, myPosition, isSpectator, players, sessionScore, onPlay, onDraw, onPass, roundOverInfo, onNewRound, readyCount }) {
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => setSelectedId(null), [state.hand.length, state.board.sequence.length]);

  const playerZero = players.find((p) => p.position === 0);
  const playerOne = players.find((p) => p.position === 1);
  const opponent = isSpectator ? null : players.find((p) => p.position !== myPosition);
  const isMyTurn = !isSpectator && state.currentTurn === myPosition;

  const handlePieceClick = (piece) => {
    if (isSpectator) return;
    const m = pieceMatches(piece, state.board);
    if (!m.left && !m.right) return;
    if (state.board.sequence.length === 0) {
      onPlay(piece.id, "right");
      return;
    }
    if (m.left && m.right && state.board.leftEnd !== state.board.rightEnd) {
      setSelectedId(piece.id === selectedId ? null : piece.id);
      return;
    }
    onPlay(piece.id, m.right ? "right" : "left");
  };

  const selectedPiece = state.hand.find((p) => p.id === selectedId);
  const summary = roundOverInfo?.summary;

  return (
    <div className="sc-table dm-table">
      {isSpectator && <div className="sc-spectator-banner">A assistir</div>}
      <header className="sc-hud">
        <div className="sc-trump">
          <span className="sc-hud-label">Monte</span>
          <span className="sc-trump-value">{state.boneyardCount} peças</span>
        </div>
        <div className="sc-scores">
          {isSpectator ? (
            <>
              <div className="sc-score sc-score-a">
                <span className="sc-hud-label">{playerZero?.name ?? "Jogador 0"}</span>
                <strong>{sessionScore.p0 ?? 0}</strong>
              </div>
              <div className="sc-score sc-score-b">
                <span className="sc-hud-label">{playerOne?.name ?? "Jogador 1"}</span>
                <strong>{sessionScore.p1 ?? 0}</strong>
              </div>
            </>
          ) : (
            <>
              <div className="sc-score sc-score-a">
                <span className="sc-hud-label">Tu</span>
                <strong>{sessionScore[`p${myPosition}`] ?? 0}</strong>
              </div>
              <div className="sc-score sc-score-b">
                <span className="sc-hud-label">{opponent?.name ?? "Adversário"}</span>
                <strong>{sessionScore[`p${myPosition === 0 ? 1 : 0}`] ?? 0}</strong>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="sc-felt dm-felt">
        <div className="sc-seat-name">{isSpectator ? playerOne?.name ?? "—" : opponent?.name ?? "—"}</div>
        <div className="dm-opponent-hand">
          {Array.from({ length: state.handCounts[isSpectator ? 1 : myPosition === 0 ? 1 : 0] }).map((_, i) => (
            <div key={i} className="dm-piece-back" />
          ))}
        </div>

        <div className="dm-board">
          {state.board.sequence.length === 0 && (
            <p className="sc-subtitle">Tabuleiro vazio — joga a primeira peça</p>
          )}
          {selectedPiece && state.board.sequence.length > 0 && (
            <button className="dm-end-target dm-end-target-left" onClick={() => { onPlay(selectedPiece.id, "left"); setSelectedId(null); }}>
              ← encaixar aqui ({state.board.leftEnd})
            </button>
          )}
          <div className="dm-board-row">
            {state.board.sequence.map((p, i) => (
              <DominoPiece key={i} piece={p} disabled small vertical={p.a === p.b} />
            ))}
          </div>
          {selectedPiece && state.board.sequence.length > 0 && (
            <button className="dm-end-target dm-end-target-right" onClick={() => { onPlay(selectedPiece.id, "right"); setSelectedId(null); }}>
              encaixar aqui ({state.board.rightEnd}) →
            </button>
          )}
        </div>

        {isSpectator && (
          <div className="sc-seat-name" style={{ marginTop: 12 }}>
            {playerZero?.name ?? "—"} · {state.handCounts[0]} peças na mão
          </div>
        )}
      </div>

      <footer className="sc-my-hand-area">
        {isSpectator ? (
          <p className="sc-turn-indicator">
            Vez de {state.currentTurn === 0 ? playerZero?.name : playerOne?.name}
          </p>
        ) : (
          <>
            <p className={`sc-turn-indicator ${isMyTurn ? "sc-turn-active" : ""}`}>
              {isMyTurn ? "É a tua vez" : `Vez de ${opponent?.name ?? "..."}`}
            </p>

            {isMyTurn && state.canDraw && (
              <button className="sc-btn-primary dm-action-btn" onClick={onDraw}>
                Comprar do monte
              </button>
            )}
            {isMyTurn && state.canPass && (
              <button className="sc-btn-primary dm-action-btn" onClick={onPass}>
                Passar (sem jogadas)
              </button>
            )}

            <div className="dm-my-hand">
              {state.hand.map((piece) => {
                const m = pieceMatches(piece, state.board);
                const playable = isMyTurn && (m.left || m.right);
                return (
                  <DominoPiece
                    key={piece.id}
                    piece={piece}
                    onClick={handlePieceClick}
                    disabled={!playable}
                    selected={piece.id === selectedId}
                  />
                );
              })}
            </div>
          </>
        )}
      </footer>

      {roundOverInfo && summary && (
        <div className="sc-modal-backdrop">
          <div className="sc-modal">
            <h2>Fim da mão</h2>
            {summary.tie ? (
              <p>Jogo bloqueado — empate, ninguém pontua.</p>
            ) : (
              <p>
                {summary.type === "bateu" ? "Bateu" : "Jogo bloqueado"} —{" "}
                {isSpectator
                  ? summary.winnerPosition === 0 ? playerZero?.name : playerOne?.name
                  : summary.winnerPosition === myPosition ? "tu" : opponent?.name}{" "}
                ganha {summary.pointsWon} pontos
              </p>
            )}
            <p className="sc-subtitle">
              Sessão — {playerZero?.name ?? "Jogador 0"}: {roundOverInfo.sessionScore.p0 ?? 0} ·{" "}
              {playerOne?.name ?? "Jogador 1"}: {roundOverInfo.sessionScore.p1 ?? 0}
            </p>
            {!isSpectator && (
              <button className="sc-btn-primary" onClick={onNewRound}>
                Jogar outra mão ({readyCount}/2)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
