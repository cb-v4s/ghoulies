import React, { useCallback, useEffect, useRef, useState } from "react";
import { broadcastMessage, updateTyping } from "./websocket/actions";
import { useDispatch, useSelector } from "react-redux";
import { getRoomInfo, getUserId, setIsTyping } from "@state/room.reducer";
import { SendHorizontal } from "@lib/icons";
import { debounce } from "@/lib/misc";

export const Chat: React.FC<any> = () => {
  const dispatch = useDispatch();
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

  const updateTypingDebounce = useCallback(
    debounce((roomId: string, userId: string, state: boolean) => {
      if (!roomInfo.RoomId || !userId) return;

      updateTyping(roomId, userId, state);
    }, 200),
    []
  );

  useEffect(() => {
    if (message.length) {
      dispatch(setIsTyping(true));
      updateTypingDebounce(roomInfo.RoomId as string, userId as string, true);
    } else {
      dispatch(setIsTyping(false));
      updateTypingDebounce(roomInfo.RoomId as string, userId as string, false);
    }
  }, [message]);

  return (
    <div className="w-4/5 bg-transparent text-md">
      <form onSubmit={sendMessage}>
        <div className="relative flex focus:outline-none bg-background border-2 border-primary rounded-full py-2 px-2 w-full">
          <span className="text-bold text-primary ml-3 flex justify-center items-center select-none">
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
            className="text-primary placeholder-primary w-full outline-none bg-transparent mx-2"
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(e) => hdlKeyDown(e.key)}
          />
          <button
            type="submit"
            data-testid="chat-submit-btn"
            className="flex items-center justify-center bg-transparent py-1 mr-2 outline-none focus:outline-none"
          >
            <SendHorizontal className="text-primary w-6 h-6" />
          </button>
        </div>
      </form>
    </div>
  );
};
