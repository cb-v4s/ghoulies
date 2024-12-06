import { ReactNode, useEffect, useState } from "react";
import { appName, CONSOLE_STATE_IDENTIFIER_KEY } from "@/siteConfig";
import { useIsAuthenticated } from "@hooks/useIsAuthenticated";
import { useDispatch } from "react-redux";
import { switchConsoleState } from "@state/room.reducer";
import { X } from "@lib/icons";
import { RoomStudio } from "./sections/RoomStudio";
import { Account } from "./sections/Account";
import { capitalize } from "@lib/misc";

import "./style.css";
import { Lobby } from "./sections/Lobby";
import Draggable from "react-draggable";
import { ProtectedSection } from "./sections/Protected";

type ConsoleState = 0 | 1 | 2;

const getConsoleState = (): ConsoleState => {
  const consoleState = localStorage.getItem(CONSOLE_STATE_IDENTIFIER_KEY);
  if (consoleState?.length) {
    return parseInt(consoleState) as ConsoleState;
  }

  return 0;
};

export const Console = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useIsAuthenticated();
  const [selectedBtn, setSelectedBtn] = useState<ConsoleState>(
    getConsoleState()
  );
  const opts: { [key: string]: () => ReactNode } = {
    Lobby: () => <Lobby />,
    Studio: () => <RoomStudio />,
    Account: () => (isAuthenticated ? <Account /> : <ProtectedSection />),
  };
  const optKeys = Object.keys(opts);

  const hdlCloseConsole = (e: any) => {
    e.preventDefault();
    dispatch(switchConsoleState());
  };

  useEffect(() => {
    localStorage.setItem(CONSOLE_STATE_IDENTIFIER_KEY, selectedBtn.toString());
  }, [selectedBtn]);

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
        <div className="overflow-y-scroll console-scrollbar relative text-left bg-sky-950 h-full border-8 border-slate-800 text-md">
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
              onClick={() => setSelectedBtn(idx as ConsoleState)}
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
          className="w-[90%] md:w-4/5 lg:w-[490px] h-[26rem] px-2 text-center shadow-xl select-none"
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
