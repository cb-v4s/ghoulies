import { useSelector } from "react-redux";
import { getRoomInfo, getUsername } from "@state/room.reducer";

export const RoomData = ({
  currentRow,
  currentCol,
}: {
  currentRow: number;
  currentCol: number;
}) => {
  const username = useSelector(getUsername);
  const roomInfo = useSelector(getRoomInfo);

  if (roomInfo?.RoomId)
    return (
      <div className="text-left bottom-40 left-10 absolute text-primary select-none font-light text-sm z-[-1]">
        {roomInfo ? (
          <p>
            {roomInfo.Users.length}/50 {roomInfo.RoomId}
          </p>
        ) : null}
        <p>
          {username} {`${currentRow},${currentCol}`}
        </p>
      </div>
    );
};
