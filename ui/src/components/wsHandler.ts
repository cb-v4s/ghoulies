import { useEffect } from "react";
import { wsApiUrl } from "@/siteConfig";
import { useDispatch } from "react-redux";
import { setRoomInfo, setRoomMessage, setUserId } from "@state/room.reducer";

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
  UpdateTyping = "updateTyping",
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
  msg: string;
  from: string;
}

export interface NewRoomData {
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
    Event: RequestEvents.CreateRoom,
    Data: data,
  };

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

  ws.send(JSON.stringify(payload));
};

export const broadcastMessage = (data: BroadcastMessageData) => {
  const payload = {
    Event: RequestEvents.BroadcastMessage,
    Data: data,
  };

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

interface UpdateTyping {
  roomId: string;
  userId: string;
  isTyping: boolean;
}

export const updateTyping = (
  roomId: string,
  userId: string,
  isTyping: boolean
) => {
  const payload: {
    Event: string;
    Data: UpdateTyping;
  } = {
    Event: RequestEvents.UpdateTyping,
    Data: {
      roomId,
      userId,
      isTyping,
    },
  };

  console.log("sentttt", payload);
  ws.send(JSON.stringify(payload));
};

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

  useEffect(() => {
    ws.onmessage = (ev: MessageEvent<any>) => {
      const wsResponse: WsResponseData = JSON.parse(ev.data);
      const event = wsResponse.Event;

      // ! TODO: we must assure the data is the type we expect
      const data = wsResponse.Data;

      switch (event) {
        case ResponseEvents.UpdateScene:
          dispatch(setRoomInfo(data));

          break;
        case ResponseEvents.BroadcastMessage:
          dispatch(setRoomMessage(data));

          break;
        case ResponseEvents.SetUserId:
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
