import { Message } from "../../types";

import "./styles.css";

export const Chatbox = ({ messages }: { messages: Message[] }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-40">
      {messages.length
        ? messages.map(({ Msg, From }) => (
            <div
              id="message"
              className={`w-8/12 h-6 flex rounded-lg bg-transparent select-none absolute bottom-0 right-10`}
            >
              <div className="w-[8%] bg-sky-300 bg-contain bg-no-repeat bg-center bg-[url('/sprites/lghostie.png')] h-full text-white flex justify-center items-center rounded-l-lg">
                a
              </div>
              <div className="w-auto max-w-[92%] h-100 bg-white text-black pl-2 pr-4 rounded-r-lg text-sm flex items-center">
                <span className="mr-2 font-bold text-slate-800">{From}:</span>
                <span>{Msg}</span>
              </div>
            </div>
          ))
        : null}
    </div>
  );
};
