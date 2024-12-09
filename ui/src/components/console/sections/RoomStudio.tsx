import { useState } from "react";
import { ArrowRight, SquareArrowOutUpRight } from "@lib/icons";
import { newRoom, NewRoomData } from "@components/wsHandler";
import { getRandomUsername } from "@lib/misc";
import { getAccessTokenPayload } from "@lib/auth";
import { useDispatch } from "react-redux";
import { setUsername, switchConsoleState } from "@state/room.reducer";

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
    password: "",
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
      <h2 className="text-md font-semibold text-primary lext-left mt-2 pb-1 uppercase border-b-2 border-primary">
        new room
      </h2>
      <form className="mt-6" onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="flex flex-col mt-2 space-y-2">
            <div className="flex">
              <label
                className="w-[30%] pr-4 py-1 text-left text-primary"
                htmlFor="roomName"
              >
                Room Name
              </label>

              <input
                className="w-[70%] rounded-sm border-2 border-primary outline-none focus:outline-none bg-transparent text-primary px-4"
                name="roomName"
                value={formData.roomName}
                onChange={updateFormData}
                placeholder="Add a room name"
                type="text"
              />
            </div>

            <div className="flex">
              <label
                className="w-[30%] pr-4 py-1 text-left text-primary"
                htmlFor="userName"
              >
                Owner
              </label>

              <input
                className="w-[70%] rounded-sm border-2 border-primary outline-none focus:outline-none bg-transparent text-primary px-4"
                name="userName"
                value={formData.userName}
                onChange={updateFormData}
                placeholder="Choose a username"
                type="text"
              />
            </div>

            <div className="flex">
              <label
                className="w-[30%] pr-4 py-1 text-left text-primary"
                htmlFor="userName"
              >
                Password
              </label>

              <input
                className="w-[70%] rounded-sm border-2 border-primary outline-none focus:outline-none bg-transparent text-primary px-4"
                name="password"
                value={formData.password}
                onChange={updateFormData}
                placeholder="Choose a password"
                type="text"
              />
            </div>
          </div>

          <div className="pt-2 pb-4 flex flex-row items-center justify-center border-t-2 border-primary">
            <div className="text-sm text-slate-300">
              <span>Learn about </span>
              <span className="border-b underline">
                <a className="inline-block select-none">
                  Conduct guidelines
                  <SquareArrowOutUpRight className="inline-block w-4 h-4 ml-1 mt-[-3px]" />
                </a>
              </span>
            </div>
            <button
              className="text-primary px-4 py-1 ml-auto outline-none focus:outline-none border-2 border-primary flex items-center justify-center"
              type="submit"
            >
              <span className="mr-2">Join room</span>
              <ArrowRight className="mt-.5" size={18} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
