import { Room } from "@components/room";
import { Controls } from "@components/Controls.tsx";
import { Console } from "@components/console";
import { useSelector, useDispatch } from "react-redux";
import {
  getConsoleState,
  getMessages,
  cleanMessages,
} from "@state/room.reducer";
import { Chatbox } from "@components/chatbox";
import useInterval from "@hooks/useInterval.tsx";

const Lobby = () => {
  const dispatch = useDispatch();
  const displayConsole = useSelector(getConsoleState);
  const messages = useSelector(getMessages);

  useInterval(() => {
    dispatch(cleanMessages());
  }, 1000);

  return (
    <>
      {displayConsole && <Console />}
      <div className="relative w-full h-full">
        <Chatbox messages={messages} />
        <Room />
        <Controls />
      </div>
    </>
  );
};

export default Lobby;
