import React, { useRef, useState } from "react";
import { broadcastMessage } from "./wsHandler";
import { useSelector } from "react-redux";
import { getRoomInfo, getUserId } from "@state/room.reducer";
import { SendHorizontal } from "@lib/icons";

export const Chat: React.FC<any> = () => {
  const inputChatMessage = useRef<any>();
  const [targetUserId, _] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const userId = useSelector(getUserId);
  const roomInfo = useSelector(getRoomInfo);
  const maxMsgLen = 60;

  const sendMessage = (event: any) => {
    event.preventDefault();

    if (!roomInfo?.RoomId || !userId || !message) return;

    broadcastMessage({
      roomId: roomInfo.RoomId,
      msg: message,
      from: userId,
    });

    setMessage("");
  };

  const hdlKeyDown = (key: string) => {
    if (!message.length && key === "Backspace") {
      if (document.activeElement !== inputChatMessage.current) {
        inputChatMessage.current.focus();
      }
    }
  };

  return (
    <div className="w-4/5 bg-transparent text-md">
      <form onSubmit={sendMessage}>
        <div className="relative flex focus:outline-none focus:placeholder-gray-400 bg-[#1f283b] rounded-full py-2 px-2 w-full">
          <span className="text-bold text-slate-200 ml-3 flex justify-center items-center select-none">
            {targetUserId !== null ? targetUserId : "Everyone"}
          </span>
          <input
            type="text"
            data-testid="chat-input"
            ref={inputChatMessage}
            autoFocus
            placeholder="Type your message..."
            value={message}
            maxLength={maxMsgLen}
            className="text-slate-100 placeholder-slate-300 w-full outline-none bg-transparent mx-2"
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(e) => hdlKeyDown(e.key)}
          />
          <button
            type="submit"
            data-testid="chat-submit-btn"
            className="flex items-center justify-center bg-transparent py-1 mr-2 outline-none focus:outline-none"
          >
            <SendHorizontal className="text-slate-300 w-6 h-6" />
          </button>
        </div>
      </form>
    </div>
  );
};
