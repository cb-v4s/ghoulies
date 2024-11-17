import { Room } from "../components/room";
import { Controls } from "../components/Controls.tsx";
import { Console } from "../components/console";
import { useSelector, useDispatch } from "react-redux";
import {
  getConsoleState,
  getMessages,
  removeFirstMessage,
} from "../state/room.reducer";
import { Chatbox } from "../components/chatbox";
import { useEffect } from "react";

const Lobby = () => {
  const dispatch = useDispatch();
  const displayConsole = useSelector(getConsoleState);
  const messages = useSelector(getMessages);
  const MessageDurationSec = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeFirstMessage());
    }, MessageDurationSec * 1000);

    return () => clearTimeout(timer);
  }, [dispatch, messages]);

  return (
    <div className="relative w-full h-full">
      <Chatbox messages={messages} />
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
