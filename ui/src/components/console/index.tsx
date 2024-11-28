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
      // Check if the clicked element is inside the component
      if (!event.target.closest("#console")) {
        dispatch(switchConsoleState());
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const Header = () => {
    return (
      <>
        <div
          id="dotted-grid"
          className="w-[98%] h-10 top-[-10px] left-1 absolute rounded-t-3xl"
        ></div>
        <div className="bg-console-100 px-1 py-0 absolute buttom-1 left-40 mt-[-6px]">
          <span className="text-console-300 font-light text-sm">
            {capitalize(appName)} Console
          </span>
        </div>
        <button
          className="absolute top-0 right-2 outline-none focus:outline-none bg-console-200"
          onClick={hdlCloseConsole}
        >
          <X className="w-5 h-5 text-slate-300 hover:text-slate-100 transition duration-150 font-bold" />
        </button>
      </>
    );
  };

  const Body = () => {
    return (
      <div className="mt-5 h-[94%]">
        <div className="overflow-y-scroll console-scrollbar relative text-left bg-sky-950 h-full border-8 border-slate-900 text-md">
          {opts[optKeys[selectedBtn]]()}
        </div>
      </div>
    );
  };

  const Footer = () => {
    return (
      <div className="mx-auto mt-3 text-slate-200 font-bold space-x-2 flex flex-row justify-center items-center">
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
    <div className="absolute w-full h-full flex items-center justify-center">
      <div
        id="console"
        className="w-[90%] md:w-4/5 lg:w-3/5 h-[24rem] pt-3 pb-14 px-2 text-center relative shadow-xl select-none"
      >
        <Header />
        <Body />
        <Footer />
      </div>
    </div>
  );
};
