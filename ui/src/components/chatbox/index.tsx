import { Message } from "../../types";

import "./styles.css";

export const Chatbox = ({ messages }: { messages: Message[] }) => {
  const bubbleHeight = 24; // translates to px based on tailwind's h-6 // TODO: handle responsive design
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
                  className="w-8/12 flex rounded-lg bg-transparent select-none absolute bottom-0"
                  style={chatBubbleStyle}
                >
                  <div className="w-[8%] bg-sky-300 bg-contain bg-no-repeat bg-center bg-[url('/sprites/lghosty.png')] h-full text-white flex justify-center items-center rounded-l-lg">
                    a
                  </div>
                  <div className="w-auto max-w-[92%] h-100 bg-white text-black pl-2 pr-4 rounded-r-lg text-sm flex items-center">
                    <span className="mr-2 font-bold text-slate-800">
                      {From}:
                    </span>
                    <span>{Msg}</span>
                  </div>
                </div>
              );
            })
        : null}
    </div>
  );
};
