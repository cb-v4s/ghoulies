import { ReactNode, useEffect, useState } from "react";
import { fetchRooms } from "../../apiHooks";
import { RoomInfo } from "../../types";
import { appName } from "../../siteConfig";
import { useDispatch, useSelector } from "react-redux";
import {
  switchConsoleState,
  setUsername,
  getRoomInfo,
  setDefaultState,
  getUserId,
} from "../../state/room.reducer";
import { X } from "../../lib/icons";
import { RoomStudio } from "./sections/RoomStudio";
import { Friends } from "./sections/Friends";
import { capitalize, getRandomUsername } from "../../lib/misc";
import { joinRoom, leaveRoom } from "../wsHandler";
import { getAccessTokenPayload } from "../../lib/auth";
import { Accordeon } from "../Accordeon";

export const Console = () => {
  const dispatch = useDispatch();
  const userId = useSelector(getUserId);
  const roomInfo = useSelector(getRoomInfo);
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

  const hdlSelectRoom = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    roomId: string
  ) => {
    e.preventDefault();

    let username = "";
    const accessTokenPayload = getAccessTokenPayload();
    if (!accessTokenPayload?.username) {
      username = getRandomUsername();
    } else {
      username = accessTokenPayload.username;
    }

    try {
      joinRoom({
        roomId,
        userName: username,
      });

      dispatch(switchConsoleState());
      dispatch(setUsername({ username: username }));
    } catch (err) {
      console.error("couldn't join room", err);
    }
  };

  const hdlCloseConnection = (e: any) => {
    e.preventDefault();
    if (!userId) return;

    leaveRoom({ userId });
    dispatch(setDefaultState());
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
          {roomInfo?.RoomId === roomId ? (
            <span>You are here</span>
          ) : (
            <button
              className="text-blue-500 hover:underline"
              onClick={(e) => hdlSelectRoom(e, roomId)}
            >
              Join Room
            </button>
          )}
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
      if (!event.target.closest("#console")) {
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
      "Room-o-matic": () => <RoomStudio />,
      Friends: () => <Friends />,
    };

    const optKeys = Object.keys(opts);
    const baseBtnClass =
      "px-4 py-2 rounded-md border-2 border-[#7d5edb] outline-none focus:outline-none w-full";
    const selectedClass = baseBtnClass + " border-b-4 border-b-[#7d5edb]";

    return (
      <>
        <div className="mt-2 pb-10 overflow-y-scroll console-scrollbar relative text-left bg-slate-900 h-5/6 border-2 border-green-200">
          {opts[optKeys[selectedBtn]]()}
        </div>
        <div className="mx-auto mt-4 text-slate-200 font-bold space-x-2 flex flex-row justify-center items-center">
          {optKeys.map((title: string, idx: number) => (
            <div className="flex flex-col w-[30%]" key={idx}>
              <button
                key={idx}
                onClick={() => setSelectedBtn(idx)}
                className={selectedBtn === idx ? selectedClass : baseBtnClass}
              ></button>
              <span className="text-sm mt-2">{title}</span>
            </div>
          ))}
        </div>
      </>
    );
  };

  const Rooms = () => {
    const PublicRooms = () => {
      return (
        <table className="table-auto w-full border-separate border-spacing-y-3">
          <tbody>{rooms && rooms.length ? <Rows /> : null}</tbody>
        </table>
      );
    };

    const sections = [
      {
        title: "Public rooms",
        content: () => <PublicRooms />,
      },
      {
        title: "Events",
        content: () => (
          <>
            <p className="text-slate-200">
              Looks like there is nothing here yet.
            </p>
          </>
        ),
      },
    ];

    return (
      <div className="my-4">
        <Accordeon sections={sections} />;
      </div>
    );
  };

  return (
    <div className="absolute w-full h-full flex items-center justify-center z-50">
      <div
        id="console"
        className="w-full md:w-4/5 lg:w-3/5 h-96 bg-[#A593F2] rounded-xl pt-3 pb-14 px-6 text-center relative shadow-xl border-2 border-[#7d5edb] select-none"
      >
        <span className="text-[#7d5edb] font-bold text-sm">
          {capitalize(appName)} Console
        </span>
        <button
          className="absolute top-2 right-2 outline-none focus:outline-none"
          onClick={hdlCloseConsole}
        >
          <X className="w-5 h-5 text-[#7d5edb] hover:text-slate-300 transition duration-150 font-bold" />
        </button>

        {ConsoleContent()}
      </div>
    </div>
  );
};
