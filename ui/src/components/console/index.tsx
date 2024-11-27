import { ReactNode, useEffect, useState } from "react";
import { appName } from "@/siteConfig";
import { useDispatch, useSelector } from "react-redux";
import {
  switchConsoleState,
  setUsername,
  getRoomInfo,
  setDefaultState,
  getUserId,
} from "@state/room.reducer";
import { X } from "@lib/icons";
import { RoomStudio } from "./sections/RoomStudio";
import { Friends } from "./sections/Friends";
import { capitalize, getRandomUsername } from "@lib/misc";
import { joinRoom, leaveRoom } from "@/components/wsHandler";
import { getAccessTokenPayload } from "@lib/auth";
import { Accordeon } from "@components/Accordeon";
import { useFetch } from "@/lib/query";
import { PopularRoomsResponse } from "@/types";

import "./style.css";

export const Console = () => {
  const dispatch = useDispatch();
  const userId = useSelector(getUserId);
  const roomInfo = useSelector(getRoomInfo);
  const [selectedBtn, setSelectedBtn] = useState<number>(0);
  const opts: { [key: string]: () => ReactNode } = {
    Lobby: () => <Rooms />,
    Studio: () => <RoomStudio />,
    Friends: () => <Friends />,
  };
  const optKeys = Object.keys(opts);

  // queries
  const {
    data: roomsResponse,
    isLoading: fetchRoomsLoading,
    error: fetchRoomsError,
  } = useFetch<PopularRoomsResponse>("/rooms");
  const { rooms } = roomsResponse || { rooms: [] };

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
      <tr className="text-slate-200" key={idx}>
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
    return (
      <>
        {/* SCREEN */}

        {/* END SCREEN */}
      </>
    );
  };

  const Rooms = () => {
    const PublicRooms = () => {
      return (
        <table className="table-auto w-full border-separate border-spacing-y-3">
          <tbody>{rooms.length ? <Rows /> : null}</tbody>
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
        <Accordeon sections={sections} />
      </div>
    );
  };

  return (
    <div className="absolute w-full h-full flex items-center justify-center">
      <div
        id="console"
        className="w-[90%] md:w-4/5 lg:w-3/5 h-[24rem] bg-[#A593F2] pt-3 pb-14 px-2 text-center relative shadow-xl select-none"
      >
        <div
          id="dotted-grid"
          className="w-[98%] h-10 top-[-10px] left-1 absolute rounded-t-3xl"
        ></div>
        <div className="bg-[#B096F9] px-1 py-0 absolute buttom-1 left-40 mt-[-6px]">
          <span className="text-[#7d5edb] font-light text-sm">
            {capitalize(appName)} Console
          </span>
        </div>
        <button
          className="absolute top-0 right-2 outline-none focus:outline-none bg-[#B096F9]"
          onClick={hdlCloseConsole}
        >
          <X className="w-5 h-5 text-slate-300 hover:text-slate-100 transition duration-150 font-bold" />
        </button>

        <div className="mt-5 h-[94%]">
          <div className="overflow-y-scroll console-scrollbar relative text-left bg-sky-950 h-full border-8 border-slate-900 text-lg">
            {opts[optKeys[selectedBtn]]()}
          </div>
        </div>

        {/* BUTTONS SECTION */}
        <div className="mx-auto mt-3 text-slate-200 font-bold space-x-2 flex flex-row justify-center items-center">
          {optKeys.map((title: string, idx: number) => (
            <div className="flex flex-col w-[30%]" key={idx}>
              <button
                id="pixel-button"
                key={idx}
                className="outline-none focus:outline-none"
                onClick={() => setSelectedBtn(idx)}
              >
                <span className="text-xs md:text-sm">{title}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
