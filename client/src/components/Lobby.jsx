import { useState, useEffect, useCallback } from "react";
import { socket } from "../socket.js";

const GAME_LABEL = {
  sueca: "Sueca",
  domino: "Dominó",
  checkers: "Damas",
  connect4: "Quatro em Linha",
  tictactoe: "Jogo do Galo",
};
const GAME_META = {
  sueca: "4 jogadores · 40 cartas",
  domino: "2 jogadores · 28 peças",
  checkers: "2 jogadores · tabuleiro 8x8",
  connect4: "2 jogadores · tabuleiro 7x6",
  tictactoe: "2 jogadores · tabuleiro 3x3",
};

export default function Lobby({ onJoin, players, joined, readyCount, neededCount, onReady, gameType, isSpectator, spectatorCount }) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [spectateMode, setSpectateMode] = useState(false);
  const [roomId, setRoomId] = useState("sala-1");
  const [name, setName] = useState("");
  const [openRooms, setOpenRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Sugere o próximo nome de sala livre (sala-1, sala-2, ...) sempre que se escolhe um jogo.
  useEffect(() => {
    if (!selectedGame) return;
    socket.emit("suggest-room-name", { prefix: "sala" }, (res) => {
      if (res?.roomId) setRoomId(res.roomId);
    });
  }, [selectedGame]);

  const fetchOpenRooms = useCallback(() => {
    setLoadingRooms(true);
    socket.emit("list-open-rooms", {}, (list) => {
      setOpenRooms(list || []);
      setLoadingRooms(false);
    });
  }, []);

  useEffect(() => {
    if (spectateMode) fetchOpenRooms();
  }, [spectateMode, fetchOpenRooms]);

  if (!joined) {
    if (spectateMode) {
      return (
        <div className="sc-lobby">
          <h1 className="sc-title">Tele-espectador</h1>
          <p className="sc-subtitle">Escolhe uma sala para assistir, sem teres de saber o nome de cor</p>

          <label className="sc-field">
            O teu nome
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Tiago" />
          </label>

          {loadingRooms ? (
            <p className="sc-subtitle">A carregar salas...</p>
          ) : openRooms.length === 0 ? (
            <p className="sc-subtitle">Não há salas abertas neste momento.</p>
          ) : (
            <ul className="sc-room-list">
              {openRooms.map((r) => (
                <li key={r.roomId}>
                  <button
                    className="sc-room-item"
                    disabled={!name.trim()}
                    onClick={() => onJoin(r.roomId, name.trim(), r.gameType, { spectate: true })}
                  >
                    <span className="sc-room-item-name">{r.roomId}</span>
                    <span className="sc-room-item-game">{GAME_LABEL[r.gameType] ?? r.gameType}</span>
                    <span className="sc-room-item-status">
                      {r.inProgress ? "A jogar" : "À espera de jogadores"} · {r.playerCount}/{r.maxPlayers} jogadores
                      {r.spectatorCount > 0 ? ` · ${r.spectatorCount} a assistir` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button className="sc-btn-link" onClick={fetchOpenRooms}>
            ↻ Atualizar lista
          </button>
          <button className="sc-btn-link" onClick={() => setSpectateMode(false)}>
            ← Voltar
          </button>
        </div>
      );
    }

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
            <button className="sc-game-choice" onClick={() => setSelectedGame("connect4")}>
              <span className="sc-game-choice-icon">●</span>
              <span>Quatro em Linha</span>
              <span className="sc-game-choice-meta">2 jogadores · 1 vs 1</span>
            </button>
            <button className="sc-game-choice" onClick={() => setSelectedGame("tictactoe")}>
              <span className="sc-game-choice-icon">✕</span>
              <span>Jogo do Galo</span>
              <span className="sc-game-choice-meta">2 jogadores · 1 vs 1</span>
            </button>
          </div>
          <button className="sc-btn-link" onClick={() => setSpectateMode(true)}>
            Tele-espectador — assistir a uma sala já aberta
          </button>
        </div>
      );
    }

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
          onClick={() => onJoin(roomId.trim() || "sala-1", name.trim(), selectedGame)}
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
        <p className="sc-subtitle">Estás a assistir a este jogo sem participar.</p>
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
