import React, { useEffect, useRef } from "react";

export const Canvas = ({
  userId,
  roomInfo,
  canvasSize,
  draw,
  locations,
  mapOffset,
  onMouseDown,
  onMouseUp,
  resources,
  updateMapOffset,
  updateCanvasSize,
}: {
  userId: any;
  roomInfo: any;
  canvasSize: any;
  draw: any;
  locations: any;
  mapOffset: any;
  onMouseDown: any;
  onMouseUp: any;
  resources: any;
  updateMapOffset: any;
  updateCanvasSize: any;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    updateCanvasSize();

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.height = canvasSize.height;
    canvas.width = canvasSize.width;

    const ctx = canvas?.getContext("2d");

    canvas.addEventListener("mouseup", (e) => onMouseUp(e, canvas));
    canvas.addEventListener("mousedown", (e) => onMouseDown(e, canvas));
    window.addEventListener("resize", updateCanvasSize);

    if (ctx) draw(ctx, resources.images.tileMap.imgElem);

    return () => {
      canvas.removeEventListener("mouseup", (e) => onMouseUp(e, canvas));
      canvas.removeEventListener("mousedown", (e) => onMouseDown(e, canvas));
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.height = canvasSize.height;
    canvas.width = canvasSize.width;
    updateMapOffset(mapOffset.x, mapOffset.y);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      const drawFrame = () => {
        draw(ctx, resources.images.tileMap.imgElem);
        requestAnimationFrame(drawFrame);
      };

      drawFrame();
    }
  }, [locations, mapOffset, userId, roomInfo]);

  return <canvas ref={canvasRef} />;
};
