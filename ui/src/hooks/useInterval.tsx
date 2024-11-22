import { useEffect, useRef } from "react";

const useInterval = (callback: () => void, delayMs: number | null) => {
  const savedCallback = useRef<() => void>();

  // Save the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    if (delayMs !== null) {
      const id = setInterval(tick, delayMs);
      return () => clearInterval(id); // Cleanup on unmount
    }
  }, [delayMs]);
};

export default useInterval;
