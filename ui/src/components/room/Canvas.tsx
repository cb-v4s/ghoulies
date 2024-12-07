import { CanvasDimensions, MapOffset, Room } from "@/types";
import { useEffect, useRef } from "react";

export const Canvas = ({
  roomInfo,
  canvasSize,
  draw,
  mapOffset,
  onMouseDown,
  updateMapOffset,
  updateCanvasSize,
}: {
  roomInfo: Room;
  canvasSize: CanvasDimensions;
  draw: (ctx: CanvasRenderingContext2D) => void;
  mapOffset: MapOffset;
  onMouseDown: (e: MouseEvent, canvas: HTMLCanvasElement) => void;
  updateMapOffset: (x: number, y: number) => void;
  updateCanvasSize: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    updateCanvasSize();

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.height = canvasSize.height;
    canvas.width = canvasSize.width;

    // Create off-screen canvas
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = canvasSize.width;
    offscreenCanvas.height = canvasSize.height;
    offscreenCanvasRef.current = offscreenCanvas;

    canvas.addEventListener("mousedown", (e: MouseEvent) =>
      onMouseDown(e, canvas)
    );
    window.addEventListener("resize", () => updateCanvasSize());

    return () => {
      canvas.removeEventListener("mousedown", (e) => onMouseDown(e, canvas));
      window.removeEventListener("resize", () => updateCanvasSize());
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const offscreenCanvas = offscreenCanvasRef.current;

    if (!canvas || !offscreenCanvas) return;

    canvas.height = canvasSize.height;
    canvas.width = canvasSize.width;
    updateMapOffset(mapOffset.x, mapOffset.y);

    const ctx = offscreenCanvas.getContext("2d");
    if (!ctx) return;

    const drawFrame = () => {
      // Clear the offscreen canvas
      ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

      // Draw to the offscreen canvas
      draw(ctx);

      // Draw the offscreen canvas to the main canvas
      const mainCtx = canvas.getContext("2d");
      if (mainCtx) {
        mainCtx.clearRect(0, 0, canvas.width, canvas.height); // Clear the main canvas
        mainCtx.drawImage(offscreenCanvas, 0, 0);
      }

      requestAnimationFrame(drawFrame);
    };

    drawFrame();
  }, [mapOffset, roomInfo]); // Only depend on necessary state

  return <canvas ref={canvasRef} />;
};
