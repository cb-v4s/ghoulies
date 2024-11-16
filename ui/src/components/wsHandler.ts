import { useEffect } from "react";
import { wsApiUrl } from "../siteConfig";
import { useDispatch } from "react-redux";
import { setRoomInfo, setUserId } from "../state/room.reducer";

export const ws = new WebSocket(wsApiUrl);

interface WsResponseData {
  Event: string;
  Data: any;
}

enum RequestEvents {
  CreateRoom = "newRoom",
  JoinRoom = "joinRoom",
  UpdatePosition = "updatePosition", // ! this should include facingDirection (right or left)
  BroadcastMessage = "broadcastMessage",
}

enum ResponseEvents {
  UpdateScene = "updateScene",
  BroadcastMessage = "broadcastMessage",
  SetUserId = "setUserId",
}

interface JoinRoomData {
  roomId: string;
  userName: string;
}

interface BroadcastMessageData {
  roomId: string;
  from: string;
  msg: string;
}
export const joinRoom = (data: JoinRoomData) => {
  const payload = {
    Event: RequestEvents.JoinRoom,
    Data: data,
  };

  console.log("from ws.joinRoom: ", payload);
  ws.send(JSON.stringify(payload));
};

export const broadcastMessage = (data: BroadcastMessageData) => {
  const payload = {
    Event: RequestEvents.BroadcastMessage,
    Data: data,
  };

  console.log("from ws.broadcastMessage: ", payload);

  ws.send(JSON.stringify(payload));
};

interface UpdatePositionData {
  dest: string;
  roomId: string;
  userId: string;
}

export const updatePosition = (
  roomId: string,
  userId: string,
  x: number,
  y: number
) => {
  const payload: {
    Event: string;
    Data: UpdatePositionData;
  } = {
    Event: RequestEvents.UpdatePosition,
    Data: {
      dest: `${x},${y}`,
      roomId,
      userId,
    },
  };

  ws.send(JSON.stringify(payload));
};

export const WsHandler = () => {
  const dispatch = useDispatch();
  // const roomInfo = useSelector(getRoomInfo)

  useEffect(() => {
    ws.onmessage = (ev: MessageEvent<any>) => {
      const wsResponse: WsResponseData = JSON.parse(ev.data);
      const event = wsResponse.Event;
      const data = wsResponse.Data;

      switch (event) {
        case ResponseEvents.UpdateScene:
          console.log("setting data as roomInfo =>", data);
          dispatch(setRoomInfo(data));

          break;
        case ResponseEvents.BroadcastMessage:
          console.log("New message received", data);

          break;
        case ResponseEvents.SetUserId:
          console.log("setUserId: ", data);
          dispatch(setUserId(data));

          break;
        default:
          console.log("unknown event received: ", event);
      }
    };

    return () => {
      //   socket.disconnect(); // * disconnect the socket connection
      //   socket.off("userCreated"); // * unsubscribe from the "userCreated" event
    };
  }, [ws /*, dispatch */]);

  return null;
};
