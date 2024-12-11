import { useEffect } from "react";
import { wsApiUrl } from "@/siteConfig";
import { useDispatch } from "react-redux";
import {
  setEmptyChatbox,
  setRoomInfo,
  setRoomMessage,
  setUserId,
  setUserPosition,
  switchConsoleState,
} from "@state/room.reducer";
import { ResponseEvents, WsResponseData } from "./types";
import { callUser } from "./actions";

export var ws: WebSocket | undefined;

const NewWsConn = (): Promise<WebSocket> => {
  let newWs = new WebSocket(wsApiUrl);

  return new Promise((res, rej) => {
    newWs.onopen = () => {
      console.log("new ws conn!");
      res(newWs);
    };
    newWs.onerror = (err) => rej(err);
  });
};

const CloseWsConn = async (): Promise<boolean> => {
  return new Promise((res, rej) => {
    if (!ws || ws.readyState !== ws.OPEN) {
      res(false);
      return;
    }

    ws?.close();

    ws.onclose = () => {
      console.log("ws conn closed");
      res(true);
    };

    ws.onerror = () => {
      const err = new Error("failed to close ws conn");
      rej(err);
    };
  });
};

export const initWs = async (dispatch: any) => {
  try {
    await CloseWsConn();

    ws = await NewWsConn();
  } catch (err) {
    throw err;
  }

  if (!ws) return;

  ws.onmessage = (ev: MessageEvent<any>) => {
    const wsResponse: WsResponseData = JSON.parse(ev.data);
    const event = wsResponse.Event;

    // ! TODO: we must assure the data is the type we expect
    const data = wsResponse.Data;

    switch (event) {
      case ResponseEvents.UpdateScene:
        dispatch(setRoomInfo(data));

        break;
      case ResponseEvents.UpdateUserPosition:
        dispatch(setUserPosition(data));

        break;
      case ResponseEvents.BroadcastMessage:
        dispatch(setRoomMessage(data));

        break;
      case ResponseEvents.JoinRoomSuccess:
        dispatch(setEmptyChatbox());
        dispatch(switchConsoleState());
        dispatch(setUserId(data));

        break;

      case ResponseEvents.JoinCall:
        // callUser();

        break;

      case ResponseEvents.Offer:
        // handleOffer(offer);
        break;

      case ResponseEvents.Answer:
        //   if (!peerRef.current) return;

        //   console.log("Receiving Answer");
        //   peerRef.current.setRemoteDescription(
        //     new RTCSessionDescription(message.answer)
        //   );
        break;

      case ResponseEvents.IceCandidate:
        // if (!peerRef.current) return;

        // console.log("Receiving and Adding ICE Candidate");
        // try {
        //   await peerRef.current.addIceCandidate(message.iceCandidate);
        // } catch (err) {
        //   console.log("Error Receiving ICE Candidate", err);
        // }
        break;

      default:
        console.log("unknown event received: ", event);
    }
  };

  ws.onclose = () => {
    console.log("Websocket connection closed");
  };
};

export const WsHandler = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    initWs(dispatch);

    return () => {
      ws?.close();
    };
  }, []);

  return null;
};
