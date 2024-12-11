import { useFetch } from "@/lib/query";
import { joinRoom } from "@/components/websocket/actions";
import { getAccessTokenPayload } from "@lib/auth";
import { PopularRoomsResponse } from "@/types";
import { useDispatch, useSelector } from "react-redux";
import { setUsername, getRoomInfo, getUserId } from "@/state/room.reducer";
import { getRandomUsername } from "@/lib/misc";
import { ArrowRight, KeyRound, Users as UsersIcon } from "@/lib/icons";
import { useEffect, useRef, useState } from "react";
import { initWs } from "@/components/websocket/handler";

export const Lobby = () => {
  const dispatch = useDispatch();
  const [password, setPassword] = useState<string>("");
  const inputPasswordRef = useRef<HTMLInputElement | null>(null);
  const [inputPassword, setInputPassword] = useState<number | null>(null);
  const roomInfo = useSelector(getRoomInfo);
  const {
    data: roomsResponse,
    isLoading: fetchRoomsLoading,
    error: fetchRoomsError,
  } = useFetch<PopularRoomsResponse>("/rooms");
  const { rooms } = roomsResponse || { rooms: [] };

  const hdlSelectRoom = async (
    e:
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
      | React.FormEvent<HTMLFormElement>,
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
      await initWs(dispatch);

      joinRoom({
        roomId,
        userName: username,
        password,
      });

      dispatch(setUsername({ username }));
      setPassword("");
    } catch (err) {
      console.error("couldn't join room", err);
    }
  };

  useEffect(() => {
    if (inputPassword === null) return;

    inputPasswordRef?.current?.focus();
  }, [inputPassword]);

  return (
    <div className="pt-4 px-4">
      <h2 className="text-md font-semibold text-primary lext-left mt-2 pb-1 uppercase border-b-2 border-primary">
        Public rooms
      </h2>

      {rooms?.length ? (
        <table className="table-auto w-full border-separate border-spacing-y-2 mt-4">
          <tbody>
            {rooms.map(
              ({ roomId, roomName, totalConns, isProtected }, idx: number) => (
                <tr
                  className="text-primary odd:bg-primary odd:text-background h-8"
                  key={idx}
                >
                  <td className="select-none">
                    {roomName.length < 34 ? (
                      <span>{roomName}</span>
                    ) : (
                      <span>{roomName.slice(0, 31) + "..."}</span>
                    )}
                  </td>
                  <td className="text-right flex items-center justify-center mt-1">
                    <UsersIcon className="w-4 h-4 text-inherit mr-1" />
                    <span>{totalConns}/50</span>
                  </td>
                  <td className="text-right w-[40%]">
                    {roomInfo?.RoomId === roomId ? null : (
                      <div className="flex justify-center items-center">
                        {inputPassword === idx ? (
                          <form
                            onSubmit={(e) => hdlSelectRoom(e, roomId)}
                            className="flex items-center justify-center border-2 bg-background border-primary px-2 py-3 text-primary w-[90%] h-4 ml-auto"
                          >
                            <input
                              ref={inputPasswordRef}
                              onChange={(e) => setPassword(e.target.value)}
                              value={password}
                              type="password"
                              className="bg-transparent w-full focus:outline-none text-sm"
                              placeholder="Type Password"
                            />
                            <button className="focus:outline-none">
                              <ArrowRight className="w-5 h-5 text-primary ml-2" />
                            </button>
                          </form>
                        ) : (
                          <>
                            <span className="mr-1 w-4 h-4">
                              {isProtected && (
                                <KeyRound className="w-4 h-4 text-inherit" />
                              )}
                            </span>
                            <button
                              className="underline focus:outline-none"
                              onClick={
                                isProtected
                                  ? () => setInputPassword(idx)
                                  : (e) => hdlSelectRoom(e, roomId)
                              }
                            >
                              Join Room
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      ) : (
        <p className="mt-4 text-primary">Looks like there is nothing</p>
      )}
    </div>
  );
};
