import { ReactNode, useEffect, useState } from "react";
import { fetchRooms } from "../../apiHooks";
import { RoomInfo } from "../../types";
import { appName } from "../../siteConfig";
import { useDispatch } from "react-redux";
import { switchConsoleState } from "../../state/room.reducer";
import { X } from "../../lib/icons";
import { RoomStudio } from "./sections/RoomStudio";
import { Friends } from "./sections/Friends";
import { capitalize } from "../../lib/misc";
import { joinRoom } from "../wsHandler";

export const Console = () => {
  const dispatch = useDispatch();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [selectedBtn, setSelectedBtn] = useState<number>(0);

  const getData = async () => {
    const rooms = await fetchRooms();
    if (!rooms) {
      console.error("couldnt fetch rooms");
      return;
    }

    setRooms(rooms);
  };

  const hdlSelectRoom = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    roomId: string
  ) => {
    e.preventDefault();

    try {
      joinRoom({ roomId, userName: "Alice" });
      dispatch(switchConsoleState());
    } catch (err) {
      alert("couldnt join room :(");
    }
  };

  const Rows = () => {
    return rooms.map(({ roomId, roomName, totalConns }, idx: number) => (
      <tr className="text-slate-200 text-sm " key={idx}>
        <td className="select-none">
          {roomName.length < 34 ? (
            <span>{roomName}</span>
          ) : (
            <span>{roomName.slice(0, 31) + "..."}</span>
          )}
        </td>
        <td className="text-right">
          <span>{totalConns}/50</span>
        </td>
        <td className="text-right">
          <button
            className="text-blue-500 hover:underline"
            onClick={(e) => hdlSelectRoom(e, roomId)}
          >
            Join Room
          </button>
        </td>
      </tr>
    ));
  };

  useEffect(() => {
    getData();
  }, []);

  const hdlCloseConsole = (e: any) => {
    e.preventDefault();
    dispatch(switchConsoleState());
  };

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      // Check if the clicked element is inside the component
      if (!event.target.closest(".console")) {
        dispatch(switchConsoleState());
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const ConsoleContent = () => {
    const opts: { [key: string]: () => ReactNode } = {
      Lobby: () => <Rooms />,
      "My Rooms": () => <RoomStudio />,
      Friends: () => <Friends />,
    };

    const optKeys = Object.keys(opts);
    const baseBtnClass =
      "px-4 py-2 rounded-md border-2 border-[#735faa] outline-none focus:outline-none w-[30%]";
    const selectedClass = baseBtnClass + " border-b-4 border-b-[#31284b]";

    return (
      <>
        <div className="mt-2 pb-10 overflow-y-scroll console-scrollbar relative text-left bg-slate-900 h-5/6 border-2 border-green-200">
          {opts[optKeys[selectedBtn]]()}
        </div>
        <div className="mx-auto mt-4 text-slate-200 font-bold space-x-2">
          {optKeys.map((title: string, idx: number) => (
            <button
              key={idx}
              onClick={() => setSelectedBtn(idx)}
              className={selectedBtn === idx ? selectedClass : baseBtnClass}
            >
              {title}
            </button>
          ))}
        </div>
      </>
    );
  };

  const Rooms = () => {
    return (
      <table className="table-auto w-full border-separate border-spacing-y-3 p-4">
        <thead>
          <tr className="text-left text-slate-200">
            <th>Public Rooms</th>
            <th> </th>
            <th> </th>
          </tr>
        </thead>
        <tbody>{rooms && rooms.length ? <Rows /> : null}</tbody>
      </table>
    );
  };

  return (
    <div className="w-full md:w-4/5 lg:w-3/5 h-96 bg-light-purple rounded-xl pt-3 pb-14 px-6 text-center relative console shadow-xl">
      <span className="text-slate-100 font-bold text-sm">
        {capitalize(appName)} Console
      </span>
      <button
        className="absolute top-4 right-4 outline-none focus:outline-none"
        onClick={hdlCloseConsole}
      >
        <X className="w-5 h-5 text-slate-100 hover:text-slate-300 transition duration-150 font-bold" />
      </button>

      {ConsoleContent()}
    </div>
  );
};
