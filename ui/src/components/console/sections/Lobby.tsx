import { useFetch } from "@/lib/query";
import { joinRoom, leaveRoom } from "@/components/wsHandler";
import { getAccessTokenPayload } from "@lib/auth";
import { Accordeon } from "@components/Accordeon";
import { PopularRoomsResponse } from "@/types";
import { useDispatch, useSelector } from "react-redux";
import {
  setUsername,
  getRoomInfo,
  setDefaultState,
  getUserId,
  switchConsoleState,
  setEmptyChatbox,
} from "@/state/room.reducer";
import { getRandomUsername } from "@/lib/misc";
import { Users as UsersIcon } from "@/lib/icons";

export const Lobby = () => {
  const dispatch = useDispatch();
  const userId = useSelector(getUserId);
  const roomInfo = useSelector(getRoomInfo);
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
      dispatch(setEmptyChatbox());
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

  const PublicRooms = () => {
    if (!rooms.length) <>No rooms</>;

    return (
      <table className="table-auto w-full border-separate border-spacing-y-2">
        <tbody>
          {rooms.map(({ roomId, roomName, totalConns }, idx: number) => (
            <tr
              className="text-primary odd:bg-primary odd:text-background"
              key={idx}
            >
              <td className="select-none">
                {roomName.length < 34 ? (
                  <span>{roomName}</span>
                ) : (
                  <span>{roomName.slice(0, 31) + "..."}</span>
                )}
              </td>
              <td className="text-right flex items-center justify-center">
                <UsersIcon className="w-4 h-4 text-inherit mr-1" />
                <span>{totalConns}/50</span>
              </td>
              <td className="text-right">
                {roomInfo?.RoomId === roomId ? (
                  <span>You are here</span>
                ) : (
                  <button
                    className="underline"
                    onClick={(e) => hdlSelectRoom(e, roomId)}
                  >
                    Join Room
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const sections = [
    {
      title: "PUBLIC ROOMS",
      content: () => <PublicRooms />,
    },
  ];

  return (
    <div className="pt-2 px-4">
      <Accordeon sections={sections} />
    </div>
  );
};
