import { useSelector } from "react-redux";
import { Message } from "../../types";

import "./styles.css";
import { getRoomInfo } from "../../state/room.reducer";

const colToRange = (value: number): number => {
  const maxInput = 9; // Maximum input value (0 to 9)
  const maxOutput = 500; // Maximum output value (0 to 740)

  return maxOutput - (value / maxInput) * maxOutput;
};

export const Chatbox = ({ messages }: { messages: Message[] }) => {
  const roomInfo = useSelector(getRoomInfo);

  const getBubblePosition = (username: string) => {
    const pos = roomInfo.Users.find(
      (user) => user.UserName === username
    )?.Position;
    if (!pos) return 250;

    return colToRange(pos.Col);
  };

  return (
    <div className="absolute top-0 left-0 w-full h-40 bg-sky-500">
      {messages.length
        ? messages.map(({ Msg, From }, idx: number) => {
            const bubblePosition = getBubblePosition(From);
            const chatBubbleStyle = {
              marginLeft: `${Math.floor(bubblePosition)}px`,
            };

            return (
              <div
                key={idx}
                id="message"
                className="w-8/12 h-6 flex rounded-lg bg-transparent select-none absolute bottom-0"
                style={chatBubbleStyle}
              >
                <div className="w-[8%] bg-sky-300 bg-contain bg-no-repeat bg-center bg-[url('/sprites/lghosty.png')] h-full text-white flex justify-center items-center rounded-l-lg">
                  a
                </div>
                <div className="w-auto max-w-[92%] h-100 bg-white text-black pl-2 pr-4 rounded-r-lg text-sm flex items-center">
                  <span className="mr-2 font-bold text-slate-800">{From}:</span>
                  <span>{Msg}</span>
                </div>
              </div>
            );
          })
        : null}
    </div>
  );
};
