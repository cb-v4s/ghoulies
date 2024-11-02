import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  setTarget,
  selectRooms,
  setRooms,
  setRoomId,
} from "../state/room.reducer";
import { createUser } from "../components/wsHandler";
import { fetchRooms } from "../apiHooks";

const Lobby = ({ isOpen, onClose }: { isOpen: boolean; onClose: any }) => {
  const dispatch = useDispatch();
  const [fetchRoomsLoading, setFetchRoomsLoading] = useState<boolean>(true);
  const rooms = useSelector(selectRooms);
  const [roomName, setRoomName] = useState("room1");
  const [userName, setUsername] = useState(
    `user${Math.floor(Math.random() * 100)}`
  );
  const [step, setStep] = useState<number>(1);
  const [avatarId, setAvatarId] = useState<number>(1);

  const buttons = [
    { id: 1, url: "1_r.png" },
    { id: 2, url: "2_r.png" },
    { id: 3, url: "3_r.png" },
    { id: 4, url: "4_r.png" },
    { id: 5, url: "5_r.png" },
  ];

  // step 1
  const handleSelectRoom = (rId: string) => {
    dispatch(setTarget({ username: null, id: rId }));
    setRoomName(rId);
    dispatch(setRoomId(rId));
    setStep(2);
  };

  // step 2
  const handleSelectName = (e: any) => {
    e.preventDefault();

    createUser({ roomName, userName, avatarId })
    onClose()
  };

  useEffect(() => {
    (async function () {
      setFetchRoomsLoading(true);
      const data = await fetchRooms();

      dispatch(setRooms(data));
      setFetchRoomsLoading(false);
    })();
  }, []);

  return (
    <div
      className={`fixed mb-[180px] top-0 left-0 right-0 bottom-0 flex justify-center items-center bg-opacity-50 ${
        isOpen ? "" : "hidden"
      }`}
    >
      {/* Step 1 - Room creation/selection */}
      {step === 1 && (
        <div className="bg-white p-4 rounded shadow w-auto">
          <h2 className="text-xl font-bold mb-4 text-center">Lobby</h2>

          {fetchRoomsLoading && (
            <p className="text-center">Fetching rooms...</p>
          )}

          {rooms?.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="py-2 px-4 text-left">Rooms</th>
                  <th className="py-2 px-4 text-left">Online</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room: any, idx: number) => (
                  <tr key={idx}>
                    <td
                      onClick={() => handleSelectRoom(room.title)}
                      className="py-2 px-4 text-aldebaran hover:text-black cursor-pointer"
                    >
                      {room.title}
                    </td>
                    <td className="py-2 px-4">{room.totalConns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {!fetchRoomsLoading && !rooms.length && (
            <p className="text-center">No rooms available.</p>
          )}

          <div className="flex mt-6 w-auto">
            <input
              className="px-4 py-2 mr-3 outline-none border border-gray-200"
              type="text"
              placeholder="Name your room"
              onChange={({ target }) => setRoomName(target.value)}
              value={roomName}
            />
            <button
              data-testid="create-room-btn"
              className="px-4 py-2 flex-shrink-0 bg-aldebaran text-white"
              onClick={() => handleSelectRoom(roomName)}
            >
              Create Room
            </button>
          </div>
        </div>
      )}

      {/* Step 2 - Username selection */}
      {step === 2 && (
        <div className="bg-white p-4 rounded shadow w-auto">
          <h2 className="text-xl font-bold mb-4 text-center">
            Enter your name
          </h2>

          <form className="pb-4 flex" onSubmit={handleSelectName}>
            <input
              type="text"
              className="w-full mr-3 outline-none border-2 border-gray-200 pl-2"
              value={userName}
              onChange={({ target }) => setUsername(target.value)}
            />
            <button
              data-testid="join-room-btn"
              className="px-4 py-2 flex-shrink-0 bg-aldebaran text-white"
              onClick={() => handleSelectRoom(roomName)}
            >
              Join
            </button>
          </form>
          <div className="flex items-center justify-center">
            {buttons.map((button, idx: number) => {
              const className: string = `flex items-center justify-center rounded-md p-2 ml-1 border-2 ${
                buttons[idx].id === avatarId
                  ? "border-blue-300"
                  : "border-gray-200"
              }`;

              return (
                <button
                  key={idx}
                  onClick={() => setAvatarId(buttons[idx].id)}
                  className={className}
                >
                  <img
                    src={button.url}
                    className="lg:w-[30px] lg:h-[30px] w-[40px] h-[40px]"
                    alt=""
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* <button className="text-black px-4 py-2 rounded mt-4" onClick={onClose}>
          Close
        </button> */}
    </div>
  );
};

export default Lobby;