import { googleStunServer } from "@/siteConfig";
import { initWs, ws } from "./handler";
import {
  BroadcastMessageData,
  JoinRoomData,
  LeaveRoomData,
  NewRoomData,
  RequestEvents,
  UpdatePositionData,
  UpdateTyping,
} from "./types";

const sendJSON = (payload: any) => ws?.send(JSON.stringify(payload));

export const newRoom = async (data: NewRoomData) => {
  const payload = {
    Event: RequestEvents.CreateRoom,
    Data: data,
  };

  sendJSON(payload);
};

export const joinRoom = async (data: JoinRoomData) => {
  const payload = {
    Event: RequestEvents.JoinRoom,
    Data: data,
  };

  sendJSON(payload);
};

export const broadcastMessage = (data: BroadcastMessageData) => {
  const payload = {
    Event: RequestEvents.BroadcastMessage,
    Data: data,
  };

  sendJSON(payload);
};

export const leaveRoom = (data: LeaveRoomData) => {
  const payload = {
    Event: RequestEvents.LeaveRoom,
    Data: data,
  };

  sendJSON(payload);
  ws?.close();
};

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

  sendJSON(payload);
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

  sendJSON(payload);
};

export const callUser = (peerRef: any, userStream: any) => {
  console.log("Calling Other User");
  peerRef.current = createPeer();

  userStream.current.getTracks().forEach((track: any) => {
    peerRef.current.addTrack(track, userStream.current);
  });
};

export const createPeer = () => {
  console.log("Creating Peer Connection");
  const peer = new RTCPeerConnection({
    iceServers: [{ urls: googleStunServer }],
  });

  peer.onnegotiationneeded = handleNegotiationNeeded;
  peer.onicecandidate = handleIceCandidateEvent;
  peer.ontrack = handleTrackEvent;

  return peer;
};

export const handleNegotiationNeeded = async (peerRef: any) => {
  console.log("Creating Offer");

  try {
    const myOffer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(myOffer);

    const payload = { offer: peerRef.current.localDescription };
    sendJSON(payload);
  } catch (err) {}
};

export const handleIceCandidateEvent = (e: any) => {
  console.log("Found Ice Candidate");
  if (e.candidate) {
    console.log(e.candidate);
    const payload = { iceCandidate: e.candidate };
    sendJSON(payload);
  }
};

export const handleTrackEvent = (e: any) => {
  console.log("Received Tracks");
  // If you want to handle audio tracks, you can log or process them here
};
