import React, { useState } from "react";

// components
import Chat from "../components/chat";
import UserCharacter from "../components/userCharacter";
import Lobby from "./Lobby";

import { updatePlayerPosition } from "../components/wsHandler";

// state management
import { useSelector } from "react-redux";
import { selectGridSize, selectPlayers } from "../state/room.reducer";
import { CoordinatesT } from "../types";

export const Room: React.FC<any> = () => {
  const gridSize = useSelector(selectGridSize);
  const players = useSelector(selectPlayers);
  const [modalOpen, setModalOpen] = useState<boolean>(true);
  const [allowedMovement, setAllowedMovement] = useState<boolean>(true);

  //   const openModal = () => {
  //     setModalOpen(true);
  //   };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleCharacterMovement = (row: number, col: number) => {
    if (!allowedMovement) return;

    // colisión con otros usuarios
    for (const { position } of players) {
      if (position.col === col && position.row === row) return false;
    }

    setAllowedMovement(false);
    updatePlayerPosition({ row, col });
    setTimeout(() => setAllowedMovement(true), 500);
  };

  const renderCells = (): React.ReactElement[] => {
    let cells: React.ReactElement[] = [];

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const player = players.find(
          ({ position }: { position: CoordinatesT }) =>
            position.row === row && position.col === col
        );

        cells.push(
          <div
            key={`${row}-${col}`}
            onClick={() => handleCharacterMovement(row, col)}
            className="border-2 border-sky-400 hover:border-isabella"
          >
            {player && (
              <UserCharacter
                avatar={player?.avatar[player?.avatarXAxis]}
                userId={player.userId}
                userName={player.userName}
              />
            )}
          </div>
        );
      }
    }

    return cells;
  };

  return (
    <React.Fragment>
      <h1>Room Component</h1>
      <div className="h-70v">
        <div className="border-solid border border-white rounded-t-lg flex flex-col items-center bg-aldebaran">
          <div className="grid grid-cols-10 grid-rows-10 w-80v h-70v">
            {renderCells()}
          </div>
        </div>
      </div>

      {/* <button
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        onClick={openModal}
      >
        Open Modal
      </button> */}
      <Lobby isOpen={modalOpen} onClose={closeModal} />
      <Chat />
    </React.Fragment>
  );
};
