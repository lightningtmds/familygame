import { useEffect, useState, useCallback } from "react";
import { socket } from "./socket.js";
import Lobby from "./components/Lobby.jsx";
import GameTable from "./components/GameTable.jsx";
import DominoTable from "./components/DominoTable.jsx";
import CheckersBoard from "./components/CheckersBoard.jsx";
import Connect4Board from "./components/Connect4Board.jsx";
import TicTacToeBoard from "./components/TicTacToeBoard.jsx";
import PeixinhoTable from "./components/PeixinhoTable.jsx";
import "./styles/global.css";
import "./styles/card.css";
import "./styles/table.css";
import "./styles/domino.css";
import "./styles/checkers.css";
import "./styles/connect4.css";
import "./styles/tictactoe.css";
import "./styles/peixinho.css";

export default function App() {
  const [joined, setJoined] = useState(false);
  const [myPosition, setMyPosition] = useState(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameType, setGameType] = useState(null);
  const [minPlayers, setMinPlayers] = useState(null);
  const [maxPlayers, setMaxPlayers] = useState(null);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [sessionScore, setSessionScore] = useState({});
  const [readyCount, setReadyCount] = useState(0);
  const [neededCount, setNeededCount] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [roundOverInfo, setRoundOverInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    socket.connect();

    socket.on("room-update", ({ players, sessionScore, gameType, minPlayers, maxPlayers, spectatorCount }) => {
      setPlayers(players);
      setSessionScore(sessionScore);
      setGameType(gameType);
      setMinPlayers(minPlayers);
      setMaxPlayers(maxPlayers);
      setSpectatorCount(spectatorCount ?? 0);
    });

    socket.on("ready-update", ({ readyCount, needed }) => {
      setReadyCount(readyCount);
      setNeededCount(needed);
    });

    socket.on("game-started", () => {
      setRoundOverInfo(null);
    });

    socket.on("game-state", (state) => {
      setGameState(state);
    });

    socket.on("round-over", (info) => {
      setRoundOverInfo(info);
      setSessionScore(info.sessionScore);
    });

    return () => {
      socket.off("room-update");
      socket.off("ready-update");
      socket.off("game-started");
      socket.off("game-state");
      socket.off("round-over");
      socket.disconnect();
    };
  }, []);

  const handleJoin = useCallback((roomId, name, chosenGameType, { spectate = false } = {}) => {
    socket.emit("join-game", { roomId, playerName: name, gameType: chosenGameType, spectate }, (res) => {
      if (!res.ok) {
        setError(res.reason);
        return;
      }
      setMyPosition(res.position);
      setIsSpectator(res.spectator);
      setPlayers(res.players);
      setGameType(res.gameType);
      setMinPlayers(res.minPlayers);
      setMaxPlayers(res.maxPlayers);
      setSpectatorCount(res.spectatorCount ?? 0);
      setJoined(true);
    });
  }, []);

  const handleReady = useCallback(() => {
    socket.emit("player-ready");
  }, []);

  const handlePlayCard = useCallback((cardId) => {
    socket.emit("play-card", { cardId }, (res) => {
      if (!res.ok) setError(res.reason);
    });
  }, []);

  const handlePlayDomino = useCallback((pieceId, side) => {
    socket.emit("play-domino", { pieceId, side }, (res) => {
      if (!res.ok) setError(res.reason);
    });
  }, []);

  const handleDrawDomino = useCallback(() => {
    socket.emit("draw-domino-tile", {}, (res) => {
      if (!res.ok) setError(res.reason);
    });
  }, []);

  const handlePassDomino = useCallback(() => {
    socket.emit("pass-domino-turn", {}, (res) => {
      if (!res.ok) setError(res.reason);
    });
  }, []);

  const handleCheckersMove = useCallback((from, to) => {
    socket.emit("checkers-move", { from, to }, (res) => {
      if (!res.ok) setError(res.reason);
    });
  }, []);

  const handleConnect4Drop = useCallback((column) => {
    socket.emit("connect4-move", { column }, (res) => {
      if (!res.ok) setError(res.reason);
    });
  }, []);

  const handleTicTacToePlay = useCallback((row, col) => {
    socket.emit("tictactoe-move", { row, col }, (res) => {
      if (!res.ok) setError(res.reason);
    });
  }, []);

  const handlePeixinhoAsk = useCallback((targetPosition, rank) => {
    socket.emit("peixinho-ask", { targetPosition, rank }, (res) => {
      if (!res.ok) setError(res.reason);
    });
  }, []);

  const handleNewRound = useCallback(() => {
    socket.emit("request-new-round");
    socket.emit("player-ready");
  }, []);

  return (
    <>
      {error && (
        <div className="sc-error-toast" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {!gameState ? (
        <Lobby
          onJoin={handleJoin}
          players={players}
          joined={joined}
          readyCount={readyCount}
          neededCount={neededCount ?? maxPlayers}
          onReady={handleReady}
          gameType={gameType}
          minPlayers={minPlayers}
          maxPlayers={maxPlayers}
          isSpectator={isSpectator}
          spectatorCount={spectatorCount}
        />
      ) : gameState.gameType === "domino" ? (
        <DominoTable
          state={gameState}
          myPosition={myPosition}
          isSpectator={isSpectator}
          players={players}
          sessionScore={sessionScore}
          onPlay={handlePlayDomino}
          onDraw={handleDrawDomino}
          onPass={handlePassDomino}
          roundOverInfo={roundOverInfo}
          onNewRound={handleNewRound}
          readyCount={readyCount}
        />
      ) : gameState.gameType === "checkers" ? (
        <CheckersBoard
          state={gameState}
          myPosition={myPosition}
          isSpectator={isSpectator}
          players={players}
          sessionScore={sessionScore}
          onMove={handleCheckersMove}
          roundOverInfo={roundOverInfo}
          onNewRound={handleNewRound}
          readyCount={readyCount}
        />
      ) : gameState.gameType === "connect4" ? (
        <Connect4Board
          state={gameState}
          myPosition={myPosition}
          isSpectator={isSpectator}
          players={players}
          sessionScore={sessionScore}
          onDrop={handleConnect4Drop}
          roundOverInfo={roundOverInfo}
          onNewRound={handleNewRound}
          readyCount={readyCount}
        />
      ) : gameState.gameType === "tictactoe" ? (
        <TicTacToeBoard
          state={gameState}
          myPosition={myPosition}
          isSpectator={isSpectator}
          players={players}
          sessionScore={sessionScore}
          onPlay={handleTicTacToePlay}
          roundOverInfo={roundOverInfo}
          onNewRound={handleNewRound}
          readyCount={readyCount}
        />
      ) : gameState.gameType === "peixinho" ? (
        <PeixinhoTable
          state={gameState}
          myPosition={myPosition}
          isSpectator={isSpectator}
          players={players}
          sessionScore={sessionScore}
          onAsk={handlePeixinhoAsk}
          roundOverInfo={roundOverInfo}
          onNewRound={handleNewRound}
          readyCount={readyCount}
        />
      ) : (
        <GameTable
          state={gameState}
          myPosition={myPosition}
          isSpectator={isSpectator}
          players={players}
          sessionScore={sessionScore}
          onPlayCard={handlePlayCard}
          roundOverInfo={roundOverInfo}
          onNewRound={handleNewRound}
          readyCount={readyCount}
        />
      )}
    </>
  );
}
