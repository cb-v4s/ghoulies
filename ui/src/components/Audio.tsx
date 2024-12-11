import { useEffect, useRef } from "react";

export const AudioWrapper = ({ children }: { children: any }) => {
  const userStream = useRef<MediaStream | undefined>();
  const peerRef = useRef<RTCPeerConnection | undefined>();

  const openAudio = async () => {
    const constraints = {
      audio: true,
      video: false, // Set video to false
    };

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      userStream.current = mediaStream;
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    openAudio();
  }, []);

  return <>{children}</>;
};
