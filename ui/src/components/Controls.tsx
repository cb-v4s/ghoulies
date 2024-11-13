import Chat from "./chat";
import { useDispatch } from "react-redux";
import { switchConsoleState } from "../state/room.reducer";

export const Controls = () => {
  const dispatch = useDispatch();

  const hdlSwitchConsole = (_: any) => {
    dispatch(switchConsoleState());
  };

  return (
    <div className="w-full h-16 bg-transparent flex justify-center py-2 px-4">
      <Chat />
      <button
        onClick={hdlSwitchConsole}
        className="ml-4 rounded-md flex items-center justify-center bg-transparent h-12 outline-none focus:outline-none"
      >
        <img
          className="m-auto select-none overflow-hidden w-12 h-12"
          src="/console.png"
          alt="console"
        />
      </button>
    </div>
  );
};
