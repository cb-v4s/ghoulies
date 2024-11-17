import { useSelector } from "react-redux";
import { getRoomInfo } from "../../state/room.reducer";

export const RoomData = ({
  currentRow,
  currentCol,
}: {
  currentRow: number;
  currentCol: number;
}) => {
  const roomInfo = useSelector(getRoomInfo);

  if (roomInfo?.RoomId)
    return (
      <div className="text-left bottom-40 left-10 absolute text-white select-none font-light text-sm">
        {roomInfo ? <p>{roomInfo.RoomId}</p> : null}
        <p>
          {"Anonymous"} - {`{${currentRow},${currentCol}}`}
        </p>
      </div>
    );
};
