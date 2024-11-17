import React, { createRef, useState } from "react";
import { broadcastMessage } from "./wsHandler";
import { useDispatch, useSelector } from "react-redux";
import { getRoomInfo, getUserId } from "../state/room.reducer";

export const inputChatMessage = createRef<any>();

const Chat: React.FC<any> = () => {
  const [message, setMessage] = useState<string>("");
  const userId = useSelector(getUserId);
  const roomInfo = useSelector(getRoomInfo);
  const maxMsgLen = 60;

  const sendMessage = (event: any) => {
    event.preventDefault();

    if (!roomInfo || !userId || !message) return;

    broadcastMessage({
      roomId: "",
      from: "",
      msg: "",
    });

    setMessage("");
  };

  const hdlKeyDown = (key: string) => {
    if (!message.length && key === "Backspace") {
      // dispatch(setTarget({ username: null, id: roomId }));

      // @ts-ignore
      inputChatMessage.current.focus();
    }
  };

  return (
    <div className="w-4/5 bg-transparent">
      <form onSubmit={sendMessage}>
        <div className="relative flex focus:outline-none focus:placeholder-gray-400 bg-dark-purple rounded-full py-2 px-2 w-full">
          {/* {target.id !== user?.roomId ? (
            <span className="text-bold text-gray-400 ml-3 flex justify-center items-center">
              {target.username}
            </span>
          ) : null} */}

          <input
            type="text"
            data-testid="chat-input"
            ref={inputChatMessage}
            autoFocus
            placeholder="Type your message..."
            value={message}
            maxLength={maxMsgLen}
            className="text-slate-100 placeholder-slate-300 w-full outline-none bg-transparent"
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(e) => hdlKeyDown(e.key)}
          />
          <button
            type="submit"
            data-testid="chat-submit-btn"
            className="flex items-center justify-center rounded-full px-4 py-1 text-slate-200 font-bold bg-[#6C81C4]"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
