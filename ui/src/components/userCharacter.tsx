import { useEffect, useRef, useState, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  setTarget,
  userCleanMessage,
  selectMuteUsers,
  muteUnmuteUser,
  selectUserById,
} from "../state/room.reducer";
import { useClickAway } from "../common/hooks";
import { socket, updatePlayerDirection } from "../components/wsHandler";

import { inputChatMessage } from "./Chat";

const UserCharacter = ({
  avatar,
  userId,
  userName,
}: {
  avatar: string;
  userId: string;
  userName: string;
}) => {
  const dispatch = useDispatch();
  const contextMenuRef = useRef(null);
  const user = selectUserById(userId);
  const muteUsers = useSelector(selectMuteUsers);
  const message = useSelector((state: any) => state.room.messages[userId]);
  const messageDurationSecs: number = 7;
  const [contextMenu, setContextMenu] = useState<any>();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(userCleanMessage(userId));
    }, messageDurationSecs * 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [message]);

  // ! Mover a common o algo asi
  const handleContextMenu = (e: any) => {
    e.preventDefault();

    if (socket.id === userId) return;

    setContextMenu({
      open: true,
      x: e.pageX,
      y: e.pageX,
    });
  };

  const hdlTargetSelection = () => {
    dispatch(setTarget({ username: userName, id: userId }));
    // @ts-ignore
    inputChatMessage.current.focus();
    closeContextMenu();
  };

  const hdlMuteUser = () => {
    dispatch(muteUnmuteUser(userId));
    closeContextMenu();
  };

  const closeContextMenu = () => {
    setContextMenu({
      ...contextMenu,
      open: false,
    });
  };

  const handleAvatarDirection = () => {
    if (user) updatePlayerDirection(user.position);
  };

  useClickAway(contextMenuRef, closeContextMenu);

  return (
    <Fragment>
      <div
        data-testid={`user-character-${userId}`}
        className="flex items-center justify-center relative w-full h-full"
        onContextMenu={handleContextMenu}
        onClick={handleAvatarDirection}
      >
        {message && !muteUsers.includes(userId) ? (
          <div className="w-0 absolute mt-[-135px] ml-[-20px] z-20">
            <span
              data-testid="chat-message-placeholder"
              className="bubble min-w-[2.5em]"
            >
              {message}
            </span>
          </div>
        ) : null}
        <img
          src={avatar}
          className="flex justify-center items-center mb-[50%] w-[40px] absolute border-transparent select-none"
        />
        <span className="text-xs text-white font-custom absolute mt-[32px] select-none">
          {userName}
        </span>
        {/* <div className="h-12 w-12 rounded-full bg-gray-500 shadow"></div>
        <div className="absolute h-12 w-12 rounded-full bg-gray-800 opacity-50 top-2 left-2"></div> */}
      </div>

      {contextMenu?.open ? (
        <div
          ref={contextMenuRef}
          className="rounded-md bg-white py-2 px-4 ml-[55px] mt-[-60px] absolute z-20"
        >
          <ul className="text-center">
            <li className="text-aldebaran text-xs font-bold select-none">
              {userName}
            </li>
            <li
              data-testid="chat-private-message"
              className="mt-2 text-gray-500 hover:text-gray-700 text-xs font-semibold cursor-pointer"
              onClick={hdlTargetSelection}
            >
              Message
            </li>
            {/* <li
              className="mt-2 text-gray-500 hover:text-gray-700 text-xs font-bold cursor-pointer"
              onClick={() => closeContextMenu()}
            >
              Kick
            </li> */}
            <li
              className="mt-2 text-gray-500 hover:text-gray-700 text-xs font-semibold cursor-pointer"
              onClick={hdlMuteUser}
            >
              {muteUsers.includes(userId) ? "Unmute" : "Mute"}
            </li>
          </ul>
        </div>
      ) : null}
    </Fragment>
  );
};

export default UserCharacter;
