import { useState } from "react";

export default function Lobby({ onJoin, players, joined, readyCount, neededCount, onReady, gameType, isSpectator, spectatorCount }) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [roomId, setRoomId] = useState("mesa-1");
  const [name, setName] = useState("");

  if (!joined) {
    if (!selectedGame) {
      return (
        <div className="sc-lobby">
          <h1 className="sc-title">Jogos de Cartas</h1>
          <p className="sc-subtitle">Escolhe o que queres jogar</p>
          <div className="sc-game-choices">
            <button className="sc-game-choice" onClick={() => setSelectedGame("sueca")}>
              <span className="sc-game-choice-icon">♠</span>
              <span>Sueca</span>
              <span className="sc-game-choice-meta">4 jogadores · equipas de 2</span>
            </button>
            <button className="sc-game-choice" onClick={() => setSelectedGame("domino")}>
              <span className="sc-game-choice-icon">▦</span>
              <span>Dominó</span>
              <span className="sc-game-choice-meta">2 jogadores · 1 vs 1</span>
            </button>
            <button className="sc-game-choice" onClick={() => setSelectedGame("checkers")}>
              <span className="sc-game-choice-icon">⛀</span>
              <span>Damas</span>
              <span className="sc-game-choice-meta">2 jogadores · 1 vs 1</span>
            </button>
          </div>
        </div>
      );
    }

    const GAME_LABEL = { sueca: "Sueca", domino: "Dominó", checkers: "Damas" };
    const GAME_META = { sueca: "4 jogadores · 40 cartas", domino: "2 jogadores · 28 peças", checkers: "2 jogadores · tabuleiro 8x8" };

    return (
      <div className="sc-lobby">
        <h1 className="sc-title">{GAME_LABEL[selectedGame]}</h1>
        <p className="sc-subtitle">{GAME_META[selectedGame]}</p>

        <label className="sc-field">
          Sala
          <input value={roomId} onChange={(e) => setRoomId(e.target.value)} />
        </label>
        <label className="sc-field">
          O teu nome
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Tiago" />
        </label>

        <button
          className="sc-btn-primary"
          disabled={!name.trim()}
          onClick={() => onJoin(roomId.trim() || "mesa-1", name.trim(), selectedGame)}
        >
          Entrar na mesa
        </button>
        <button className="sc-btn-link" onClick={() => setSelectedGame(null)}>
          ← Escolher outro jogo
        </button>
      </div>
    );
  }

  const totalSeats = neededCount || (gameType === "sueca" ? 4 : 2);

  if (isSpectator) {
    return (
      <div className="sc-lobby">
        <h1 className="sc-title">A assistir</h1>
        <p className="sc-subtitle">A sala está cheia — vais ver o jogo sem participar.</p>
        <ul className="sc-player-list">
          {Array.from({ length: totalSeats }).map((_, pos) => {
            const p = players.find((pl) => pl.position === pos);
            return (
              <li key={pos} className={p?.connected ? "sc-player-online" : "sc-player-offline"}>
                {p ? p.name : "— vazio —"}
              </li>
            );
          })}
        </ul>
        <p className="sc-subtitle">{readyCount}/{totalSeats} prontos{spectatorCount > 1 ? ` · ${spectatorCount} a assistir` : ""}</p>
      </div>
    );
  }

  return (
    <div className="sc-lobby">
      <h1 className="sc-title">À espera de jogadores</h1>
      <ul className="sc-player-list">
        {Array.from({ length: totalSeats }).map((_, pos) => {
          const p = players.find((pl) => pl.position === pos);
          return (
            <li key={pos} className={p?.connected ? "sc-player-online" : "sc-player-offline"}>
              {p ? p.name : "— vazio —"}
            </li>
          );
        })}
      </ul>
      <p className="sc-subtitle">
        {readyCount}/{totalSeats} prontos{spectatorCount > 0 ? ` · ${spectatorCount} a assistir` : ""}
      </p>
      <button className="sc-btn-primary" onClick={onReady} disabled={players.length < totalSeats}>
        Estou pronto
      </button>
    </div>
  );
}

