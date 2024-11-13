import { useEffect, useState } from "react";
import { fetchRooms } from "../apiHooks";
import { RoomInfo } from "../types";
import { appName } from "../siteConfig";
import { useDispatch } from "react-redux";
import { switchConsoleState } from "../state/room.reducer";
import { X } from "./icons/x";

const defaultRooms = [
  {
    roomId: "keep the block hot#3342",
    roomName: "nostrud irure incididunt culpa ullamco <3",
    roomDesc: "Qui nisi nostrud nostrud irure incididunt culpa ullamco.",
    totalConns: 0,
  },
  {
    roomId: "keep the block hot#3342",
    roomName: "keep the block hot",
    roomDesc: "Qui nisi nostrud nostrud irure incididunt culpa ullamco.",
    totalConns: 0,
  },
];

export const Console = () => {
  const dispatch = useDispatch();
  const [rooms, setRooms] = useState<RoomInfo[]>(defaultRooms);
  const [joinRoomId, setJoinRoomId] = useState<string | null>(null);
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
    setJoinRoomId(roomId);
  };

  const Rows = () => {
    return rooms.map(({ roomId, roomName, totalConns }, idx: number) => (
      <tr className="text-left text-slate-200 text-sm" key={idx}>
        <td>
          <button
            className="text-blue-50"
            onClick={(e) => hdlSelectRoom(e, roomId)}
          >
            {roomName}
          </button>
        </td>
        <td>{totalConns}/100</td>
      </tr>
    ));
  };

  useEffect(() => {
    // getData();
  }, []);

  useEffect(() => {
    if (joinRoomId) console.log("joinRoom", joinRoomId);
  }, [joinRoomId]);

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

  const ConsoleButtons = () => {
    const opts: any = {
      rooms: () => <Rooms />,
      create: () => <span className="text-slate-200">Create</span>,
      friends: () => <span className="text-slate-200">Friends</span>,
    };

    const optKeys = Object.keys(opts);
    const baseBtnClass =
      "px-4 py-2 rounded-md border-2 border-[#735faa] outline-none focus:outline-none";
    const selectedClass = baseBtnClass + " border-b-4 border-b-[#31284b]";

    return (
      <>
        <div className="mt-2 pb-10 overflow-y-scroll console-scrollbar relative text-left bg-slate-900 h-5/6 border-2 border-green-200">
          {opts[optKeys[selectedBtn]]()}
        </div>
        <div className="mx-auto mt-4 text-slate-200 font-bold space-x-2">
          {optKeys.map((title: string, idx: number) => (
            <button
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
            <th>Popular Rooms</th>
            <th>Users</th>
          </tr>
        </thead>
        <tbody>{rooms && rooms.length ? <Rows /> : null}</tbody>
      </table>
    );
  };

  return (
    <div className="w-full md:w-4/5 lg:w-3/5 h-96 bg-[#8770c4] rounded-xl pt-5 pb-14 px-6 text-center relative console shadow-xl">
      <span className="text-slate-100 font-bold">
        {capitalize(appName)} Console
      </span>
      <button
        className="absolute top-4 right-4 outline-none focus:outline-none"
        onClick={hdlCloseConsole}
      >
        <X className="w-5 h-5 text-slate-100 hover:text-slate-300 transition duration-150 font-bold" />
      </button>

      {ConsoleButtons()}
    </div>
  );
};

export const capitalize = (s: string) => {
  const firstLetter = s[0].toUpperCase();
  return firstLetter + s.slice(1, s.length);
};
