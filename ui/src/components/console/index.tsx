import { ReactNode, useEffect, useState } from "react";
import { appName } from "@/siteConfig";
import { useDispatch } from "react-redux";
import { switchConsoleState } from "@state/room.reducer";
import { X } from "@lib/icons";
import { RoomStudio } from "./sections/RoomStudio";
import { Account } from "./sections/Account";
import { capitalize } from "@lib/misc";

import "./style.css";
import { Lobby } from "./sections/Lobby";
import Draggable from "react-draggable";

export const Console = () => {
  const dispatch = useDispatch();

  const [selectedBtn, setSelectedBtn] = useState<number>(0);
  const opts: { [key: string]: () => ReactNode } = {
    Lobby: () => <Lobby />,
    Studio: () => <RoomStudio />,
    Account: () => <Account />,
  };
  const optKeys = Object.keys(opts);

  const hdlCloseConsole = (e: any) => {
    e.preventDefault();
    dispatch(switchConsoleState());
  };

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (!event.target.closest("#console")) dispatch(switchConsoleState());
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const Header = () => {
    return (
      <div className="h-[8%] w-full relative top-[-10px]">
        <div
          id="dotted-grid"
          className="w-[100%] h-10 top-[-16px] rounded-t-xl cursor-move handle"
        ></div>
        <div className="bg-console-100 px-1 py-0 absolute left-40 mt-[-28px]">
          <span className="text-console-300 font-light text-sm">
            {capitalize(appName)} Console
          </span>
        </div>
        <button
          className="absolute top-1 right-0 pl-[1px] outline-none focus:outline-none bg-console-200 border-[.3px] border-slate-400"
          onClick={hdlCloseConsole}
        >
          <X className="w-5 h-5 text-slate-300 hover:text-slate-100 transition duration-150 font-bold" />
        </button>
      </div>
    );
  };

  const Body = () => {
    return (
      <div className="h-[76%] w-full">
        <div className="overflow-y-scroll console-scrollbar relative text-left bg-sky-950 h-full border-8 border-slate-900 text-md">
          {opts[optKeys[selectedBtn]]()}
        </div>
      </div>
    );
  };

  const Footer = () => {
    return (
      <div className="h-[16%] w-full mx-auto text-slate-200 font-bold space-x-2 flex flex-row justify-center items-center">
        {optKeys.map((title: string, idx: number) => (
          <div className="flex flex-col w-[30%]" key={idx}>
            <button
              id="pixel-button"
              key={idx}
              className="outline-none focus:outline-none text-md md:text-xl uppercase cursor-pointer"
              onClick={() => setSelectedBtn(idx)}
            >
              <span className="text-xs md:text-sm">{title}</span>
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-10">
      <Draggable handle=".handle">
        <div
          id="console"
          className="w-[90%] md:w-4/5 lg:w-[460px] h-[24rem] px-2 text-center shadow-xl select-none"
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <Header />
            <Body />
            <Footer />
          </div>
        </div>
      </Draggable>
    </div>
  );
};
