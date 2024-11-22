import { Message } from "../../types";

import "./styles.css";

export const Chatbox = ({ messages }: { messages: Message[] }) => {
  const bubbleHeight = 24; // px
  const maxScreen = 500;

  const colToRange = (col: number): number => {
    const maxInput = 9; // 10x10 gridmap max 9
    const output = maxScreen - (col / maxInput) * maxScreen;
    return output;
  };

  return (
    <div className="absolute top-0 left-0 w-full h-40">
      {messages.length
        ? messages
            .slice()
            .reverse()
            .map(({ Msg, From, Position }, idx: number) => {
              const bubblePosition = colToRange(Position.Col);
              const chatBubbleStyle = {
                marginLeft: `${Math.floor(bubblePosition)}px`,
                bottom: idx === 0 ? "0px" : `${idx * bubbleHeight}px`,
                height: `${bubbleHeight}px`,
              };

              return (
                <div
                  key={idx}
                  // id="message"
                  className="w-[85%] flex rounded-lg bg-transparent select-none absolute bottom-0"
                  style={chatBubbleStyle}
                >
                  <div className="w-[6%] bg-sky-300 bg-no-repeat bg-center bg-[url('/chatbox.svg')] h-full text-white flex justify-center items-center rounded-l-lg">
                    a
                  </div>
                  <div className="w-auto max-w-[94%] h-100 bg-white text-black pl-2 pr-4 rounded-r-lg text-sm flex items-center justify-center">
                    <span className="mr-2 font-bold text-slate-800 mt-1">
                      {From}:
                    </span>
                    <span className="mt-1">
                      {Msg.length <= 60 ? Msg : `${Msg.slice(0, 57)}...`}
                    </span>
                  </div>
                </div>
              );
            })
        : null}
    </div>
  );
};
