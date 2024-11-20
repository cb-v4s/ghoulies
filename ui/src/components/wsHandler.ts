import { useEffect } from "react";
import { wsApiUrl } from "../siteConfig";
import { useDispatch } from "react-redux";
import { setRoomInfo, setRoomMessage, setUserId } from "../state/room.reducer";

export var ws = new WebSocket(wsApiUrl);

const NewWsConn = (): Promise<WebSocket> => {
  let newWs = new WebSocket(wsApiUrl);

  return new Promise((res, rej) => {
    newWs.onopen = () => res(newWs);
    newWs.onerror = (err) => rej(err);
  });
};

interface WsResponseData {
  Event: string;
  Data: any;
}

enum RequestEvents {
  CreateRoom = "newRoom",
  JoinRoom = "joinRoom",
  UpdatePosition = "updatePosition",
  BroadcastMessage = "broadcastMessage",
  LeaveRoom = "leaveRoom",
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

// TODO: username should come from login
// at the moment of signup a random username should be assigned
// you get the username from the jwt token
interface NewRoomData {
  roomName: string;
  userName: string;
}

export interface LeaveRoomData {
  userId: string;
}

export const newRoom = async (data: NewRoomData) => {
  if (ws.readyState === ws.CLOSING || ws.readyState === ws.CLOSED) {
    console.log("reopening ws connection");

    try {
      ws = await NewWsConn();
    } catch (err) {
      console.error("couldn't establish ws connection", err);
      return;
    }
  }

  const payload = {
    Event: RequestEvents.JoinRoom,
    Data: data,
  };

  console.log("from ws.joinRoom: ", payload);
  ws.send(JSON.stringify(payload));
};

export const joinRoom = async (data: JoinRoomData) => {
  if (ws.readyState === ws.CLOSING || ws.readyState === ws.CLOSED) {
    console.log("reopening ws connection");

    try {
      ws = await NewWsConn();
    } catch (err) {
      console.error("couldn't establish ws connection", err);
      return;
    }
  }

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

export const leaveRoom = (data: LeaveRoomData) => {
  const payload = {
    Event: RequestEvents.LeaveRoom,
    Data: data,
  };
  console.log("Leaving room");
  ws.send(JSON.stringify(payload));
  ws.close();
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

      // ! TODO: we must assure the data is the type we expect
      const data = wsResponse.Data;

      switch (event) {
        case ResponseEvents.UpdateScene:
          console.log("setting data as roomInfo =>", data);
          dispatch(setRoomInfo(data));

          break;
        case ResponseEvents.BroadcastMessage:
          console.log("New message received", data);
          dispatch(setRoomMessage(data));

          break;
        case ResponseEvents.SetUserId:
          console.log("setUserId: ", data);
          dispatch(setUserId(data));

          break;
        default:
          console.log("unknown event received: ", event);
      }
    };

    ws.onclose = () => {
      console.log("Websocket connection closed");
    };

    return () => {
      ws.close();
    };
  }, []);

  return null;
};
