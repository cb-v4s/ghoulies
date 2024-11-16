import { Room } from "../components/room/Room.tsx";
import { CanvasTest } from "../components/CanvasTest";
import { Controls } from "../components/Controls.tsx";
import { Console } from "../components/console";
import { useSelector } from "react-redux";
import { getConsoleState } from "../state/room.reducer.ts";

const Lobby = () => {
  const displayConsole = useSelector(getConsoleState);

  return (
    <div className="relative w-full h-full bg-sky-500">
      {displayConsole && (
        <div className="absolute w-full h-[90%] flex items-center justify-center">
          <Console />
        </div>
      )}
      {/* <Room /> */}
      <CanvasTest />
      <Controls />
    </div>
  );
};

export default Lobby;
