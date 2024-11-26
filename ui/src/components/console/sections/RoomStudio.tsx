import { useEffect, useState } from "react";
import { SquareArrowOutUpRight } from "../../../lib/icons";
import { newRoom, NewRoomData } from "../../wsHandler";
import { getRandomUsername } from "../../../lib/misc";
import { getAccessTokenPayload } from "../../../lib/auth";
import { useDispatch } from "react-redux";
import { setUsername, switchConsoleState } from "../../../state/room.reducer";

export const RoomStudio = () => {
  const dispatch = useDispatch();
  const defaultFormData = {
    roomName: "",
    userName: ((): string => {
      const payload = getAccessTokenPayload();
      if (!payload?.username) {
        return getRandomUsername();
      }

      return payload.username;
    })(),
  };

  const [formData, setFormData] = useState<NewRoomData>(defaultFormData);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { userName, roomName } = formData;
    if (!userName.length || !roomName.length) return;

    newRoom(formData);

    setFormData(defaultFormData);
    dispatch(switchConsoleState());
    dispatch(setUsername({ username: userName }));
  };

  const updateFormData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const newFormData = {
      ...formData,
      [name]: value,
    };

    setFormData(newFormData);
  };

  return (
    <div className="pt-4 px-4">
      <h2 className="text-md font-semibold text-slate-200 lext-left mt-2 mb-6">
        Create a new room
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-2">
          <div className="flex flex-col mt-2">
            <div className="flex">
              <label
                className="w-[30%] pr-4 py-2 text-left text-slate-200"
                htmlFor="roomName"
              >
                Name
              </label>

              <input
                className="w-[70%] rounded-sm border-2 border-slate-800 outline-none focus:outline-none bg-transparent text-slate-200 px-4 py-2"
                name="roomName"
                value={formData.roomName}
                onChange={updateFormData}
                placeholder="Add a room name"
                type="text"
              />
            </div>
            <div className="flex">
              <label
                className="w-[30%] pr-4 py-2 text-left text-slate-200"
                htmlFor="userName"
              >
                Enter as
              </label>

              <input
                className="w-[70%] rounded-sm border-2 border-slate-800 outline-none focus:outline-none bg-transparent text-slate-200 px-4 py-2"
                name="userName"
                value={formData.userName}
                onChange={updateFormData}
                placeholder="Choose a username"
                type="text"
              />
            </div>
          </div>

          <div className="pt-2 pb-4 flex flex-row items-center justify-center border-t-2 border-slate-800">
            <div className="text-sm text-slate-300">
              <span>Learn about </span>
              <span className="border-b border-blue-500">
                <a className="text-blue-500 inline-block select-none">
                  Conduct guidelines
                  <SquareArrowOutUpRight className="inline-block w-4 h-4 ml-1 mt-[-3px]" />
                </a>
              </span>
            </div>
            <button
              className="bg-slate-800 text-slate-200 px-4 py-1 block ml-auto outline-none focus:outline-none"
              type="submit"
            >
              Join room
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
