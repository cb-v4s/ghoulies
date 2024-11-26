import React from "react";

export const useClickAway = (ref: any, cb: Function) => {
  React.useEffect(() => {
    const hdlContextClick = (e: Event) => {
      const el = ref?.current;
      if (!el || el.contains((e.target as Node) || null)) return;

      cb(e);
    };

    document.addEventListener("mousedown", hdlContextClick);
    document.addEventListener("touchstart", hdlContextClick);

    return () => {
      document.removeEventListener("mousedown", hdlContextClick);
      document.removeEventListener("touchstart", hdlContextClick);
    };
  }, [ref, cb]);
};
