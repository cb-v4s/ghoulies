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
                  className="w-[85%] flex rounded-lg bg-background select-none absolute bottom-0"
                  style={chatBubbleStyle}
                >
                  <div className="w-[10%] bg-background bg-no-repeat bg-center bg-[url('/bubbleCharacter.webp')] h-full text-primary flex justify-center items-center rounded-l-lg border-y border-l border-primary"></div>
                  <div className="w-auto max-w-[94%] h-100 bg-background text-primary pl-2 pr-4 rounded-r-lg text-sm flex items-center justify-center border-y border-r border-primary">
                    <span className="mr-2 font-bold text-primary mt-1">
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
