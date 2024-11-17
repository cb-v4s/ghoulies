// import { Room } from "../components/room/RoomOld.tsx";
import { Room } from "../components/room";
import { Controls } from "../components/Controls.tsx";
import { Console } from "../components/console";
import { useSelector } from "react-redux";
import { getConsoleState } from "../state/room.reducer.ts";
import { Chatbox } from "../components/chatbox";

const Lobby = () => {
  const displayConsole = useSelector(getConsoleState);

  return (
    <div className="relative w-full h-full">
      <Chatbox />
      {displayConsole && (
        <div className="absolute w-full h-[90%] flex items-center justify-center">
          <Console />
        </div>
      )}
      <Room />
      <Controls />
    </div>
  );
};

export default Lobby;
