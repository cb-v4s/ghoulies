import React, { createRef, useState } from "react";
import { sendMessageTo } from "./wsHandler";
import { useDispatch, useSelector } from "react-redux";
import {
  selectTarget,
  selectUserById,
  selectUserId,
  setTarget,
  selectRoomsId,
} from "../state/room.reducer";

export const inputChatMessage = createRef<any>();

const Chat: React.FC<any> = () => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState<string>("");
  const target = useSelector(selectTarget);
  const userId = useSelector(selectUserId);
  const user = selectUserById(userId as string);
  const roomId = useSelector(selectRoomsId);

  const sendMessage = (event: any) => {
    event.preventDefault();
    if (!message) return;

    sendMessageTo(message, target?.id as string);
    setMessage("");
  };

  const hdlKeyDown = (key: string) => {
    if (!message.length && key === "Backspace") {
      dispatch(setTarget({ username: null, id: roomId }));

      // @ts-ignore
      inputChatMessage.current.focus();
    }
  };

  return (
    <React.Fragment>
      <form className="mt-1" onSubmit={sendMessage}>
        <div className="relative flex w-full focus:outline-none focus:placeholder-gray-400 bg-white rounded-b-lg py-2">
          {target.id !== user?.roomId ? (
            <span className="text-bold text-gray-400 ml-3 flex justify-center items-center">
              {target.username}
            </span>
          ) : null}

          <input
            type="text"
            data-testid="chat-input"
            ref={inputChatMessage}
            autoFocus
            placeholder="Type your message..."
            value={message}
            maxLength={60}
            className="text-gray-600 placeholder-gray-600 w-full ml-3 outline-none"
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(e) => hdlKeyDown(e.key)}
          />
          <button
            type="submit"
            data-testid="chat-submit-btn"
            className="flex items-center justify-center rounded-lg px-4 py-1 text-aldebaran font-bold"
          >
            Send
          </button>
        </div>
      </form>
    </React.Fragment>
  );
};

export default Chat;