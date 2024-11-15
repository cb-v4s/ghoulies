import { useEffect } from "react";
import { wsApiUrl } from "../siteConfig";
import { useDispatch } from "react-redux";
import { setRoomInfo } from "../state/room.reducer";

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
  JoinRoom = "joinRoom",
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

export const WsHandler = () => {
  const dispatch = useDispatch();
  // const roomInfo = useSelector(getRoomInfo)

  useEffect(() => {
    ws.onmessage = (ev: MessageEvent<any>) => {
      const wsResponse: WsResponseData = JSON.parse(ev.data);
      const event = wsResponse.Event;
      const data = wsResponse.Data;

      console.log("event received =>", wsResponse);

      if (event === ResponseEvents.JoinRoom) {
      }

      if (event === ResponseEvents.UpdateScene) {
        console.log("setting data as roomInfo =>", data);
        dispatch(setRoomInfo(data));
      }

      if (event === ResponseEvents.BroadcastMessage) {
        console.log("New message received", data);
      }
    };

    return () => {
      //   socket.disconnect(); // * disconnect the socket connection
      //   socket.off("userCreated"); // * unsubscribe from the "userCreated" event
    };
  }, [ws /*, dispatch */]);

  return null;
};
