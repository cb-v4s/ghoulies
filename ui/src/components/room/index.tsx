import { useEffect, useRef, useState } from "react";
import { resources } from "./resources";
import { useSelector } from "react-redux";
import { getRoomInfo, getUserId } from "../../state/room.reducer";
import { updatePosition } from "../wsHandler";
import { RoomData } from "./roomData";

export const Room = () => {
  const [locations, setLocations] = useState<{ x: number; y: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 740, height: 710 });
  const roomInfo = useSelector(getRoomInfo);
  const userId = useSelector(getUserId);
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [currentCol, setCurrentCol] = useState<number>(0);

  let mapOffsetX = 0;
  let mapOffsetY = 0;
  let dragThreshold = 5;
  let isDragging = false;
  let mouseDown = false;
  let mouseScreenX = 0;
  let mouseScreenY = 0;
  let mouseTileX = 0;
  let mouseTileY = 0;
  //let tileSheetWidth = 390;
  //let tileSheetHeight = 500;
  let renderStartX = 0;
  let renderStartY = 0;
  let renderFinishX = 0;
  let renderFinishY = 0;
  // How many tile sprites are on each row of the sprite sheet
  let spriteColumns = 5;
  // How much spacing/padding is around each tile sprite.
  let spritePadding = 2;
  // The full dimensions of the tile sprite.
  let blockWidth = 74;
  let blockHeight = 70;
  // The "top only" dimensions of the tile sprite.
  let tileWidth = 74;
  let tileHeight = 44;
  // How much the tiles should overlap when drawn.
  let overlapWidth = 2;
  let overlapHeight = 2;
  let projectedTileWidth = tileWidth - overlapWidth - overlapHeight;
  let projectedTileHeight = tileHeight - overlapWidth - overlapHeight;
  let tileMap = [
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  ];

  const [mapOffset, setMapOffset] = useState<{ x: number; y: number }>({
    x: 320,
    y: 180,
  });

  const draw = (
    ctx: any,
    locations: { x: number; y: number }[],
    imageRef: any
  ) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear the canvas

    for (var x = renderStartX; x <= renderFinishX; x++) {
      for (var y = renderStartY; y <= renderFinishY; y++) {
        var drawTile = tileMap[x][y];

        var spriteWidth = blockWidth + 2 * spritePadding;
        var spriteHeight = blockHeight + 2 * spritePadding;

        var srcX = (drawTile % spriteColumns) * spriteWidth + spritePadding;
        var srcY =
          Math.floor(drawTile / spriteColumns) * spriteHeight + spritePadding;

        var destPos = convertTileToScreen(x, y);
        var destX = destPos.x;
        var destY = destPos.y;
        var destWidth = blockWidth;
        var destHeight = blockHeight;

        roomInfo.Users.forEach(({ Position, Direction }) => {
          drawCharacterAt(
            ctx,
            Direction === 1
              ? resources.images.lghostie.imgElem
              : resources.images.rghostie.imgElem,
            Position.Row - 1,
            Position.Col - 1
          );
        });

        ctx.drawImage(
          imageRef,
          srcX,
          srcY,
          blockWidth,
          blockHeight,
          destX,
          destY,
          destWidth,
          destHeight
        );
      }
    }
  };

  const limit = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(value, max));
  };

  const convertScreenToTile = (screenX: number, screenY: number) => {
    let mappedX = screenX / projectedTileWidth;
    let mappedY = screenY / projectedTileHeight;

    let maxTileX = tileMap.length - 1;
    let maxTileY =
      Array.isArray(tileMap) && tileMap.length > 0 ? tileMap[0].length - 1 : 0;

    let tileX = limit(Math.round(mappedX + mappedY) - 1, 0, maxTileX);
    let tileY = limit(Math.round(-mappedX + mappedY), 0, maxTileY);

    return { x: tileX, y: tileY };
  };

  const updateMapOffset = (deltaX: number, deltaY: number) => {
    mapOffsetX += deltaX;
    mapOffsetY += deltaY;

    var firstVisbleTile = convertScreenToTile(-mapOffsetX, -mapOffsetY);

    var firstVisibleTileX = firstVisbleTile.x;
    var firstVisibleTileY = firstVisbleTile.y;

    var viewportRows = Math.ceil(canvasSize.width / projectedTileWidth);
    var viewportCols = Math.ceil(canvasSize.height / projectedTileHeight);

    var maxVisibleTiles = viewportRows + viewportCols;
    var halfVisibleTiles = Math.ceil(maxVisibleTiles / 2);

    renderStartX = Math.max(firstVisibleTileX, 0);
    renderStartY = Math.max(firstVisibleTileY - halfVisibleTiles + 1, 0);

    renderFinishX = Math.min(
      firstVisibleTileX + maxVisibleTiles,
      tileMap.length - 1
    );
    renderFinishY = Math.min(
      firstVisibleTileY + halfVisibleTiles + 1,
      tileMap[0].length - 1
    );
  };

  const convertTileToScreen = (tileX: number, tileY: number) => {
    const isoX = tileX - tileY;
    const isoY = tileX + tileY;

    const screenX = mapOffsetX + isoX * (tileWidth / 2 - overlapWidth);
    const screenY = mapOffsetY + isoY * (tileHeight / 2 - overlapHeight);

    return { x: screenX, y: screenY };
  };

  const hdlMouseMove = (e: any, canvas: any) => {
    if (mouseDown) {
      const dx = e.clientX - mouseScreenX; // distance moved in X
      const dy = e.clientY - mouseScreenY; // distance moved in Y

      // * check if the mouse has moved beyond the drag threshold
      if (Math.sqrt(dx * dx + dy * dy) > dragThreshold) {
        isDragging = true;
      }
    }

    if (!Array.isArray(tileMap) || tileMap.length < 1 || tileMap[0].length < 1)
      return;

    let rect = canvas.getBoundingClientRect();

    let newX = e.clientX - rect.left;
    let newY = e.clientY - rect.top;

    let mouseDeltaX = newX - mouseScreenX;
    let mouseDeltaY = newY - mouseScreenY;

    mouseScreenX = newX;
    mouseScreenY = newY;

    let mouseTilePos = convertScreenToTile(
      mouseScreenX - mapOffsetX,
      mouseScreenY - mapOffsetY
    );

    mouseTileX = mouseTilePos.x;
    mouseTileY = mouseTilePos.y;

    if (mouseDown) updateMapOffset(mouseDeltaX, mouseDeltaY);
  };

  const drawCharacterAt = (
    ctx: any,
    img: HTMLImageElement,
    x: number,
    y: number
  ) => {
    if (!ctx) return;

    const characterX = x;
    const characterY = y;

    // Calculate destination coordinates on the canvas
    const destPos = convertTileToScreen(characterX, characterY);
    const destX = destPos.x - 45;
    const destY = destPos.y - 10;

    // Assuming the character image is a single sprite
    const srcX = 0;
    const srcY = 0;
    const srcWidth = img.width;
    const srcHeight = img.height;

    let blockWidth = 74 + 95;
    let blockHeight = 70 + 30;

    ctx.drawImage(
      img,
      srcX,
      srcY,
      srcWidth,
      srcHeight,
      destX,
      destY,
      blockWidth,
      blockHeight
    );
  };

  const hdlMouseDown = (e: any, canvas: any) => {
    console.log("me llamaron aqui");

    // * left mouse button is pressed
    if (e.button !== 0) {
      console.log("aqui sali");
      return false;
    }

    mouseDown = true;
    isDragging = false;

    let rect = canvas.getBoundingClientRect();

    let newX = e.clientX - rect.left;
    let newY = e.clientY - rect.top;

    mouseScreenX = newX;
    mouseScreenY = newY;

    let mouseTilePos = convertScreenToTile(
      mouseScreenX - mapOffsetX,
      mouseScreenY - mapOffsetY
    );

    mouseTileX = mouseTilePos.x;
    mouseTileY = mouseTilePos.y;

    // const prevRow = currentRow;
    // const prevCol = currentCol;

    setCurrentRow(mouseTileX);
    setCurrentCol(mouseTileY);
  };

  useEffect(() => {
    console.log(`roomInfo.RoomId: ${roomInfo.RoomId}, userId: ${userId}`);
    if (roomInfo.RoomId && userId) {
      console.log(`Destination: ${currentRow},${currentCol}`);
      updatePosition(roomInfo.RoomId, userId, currentRow, currentCol);
    }
  }, [currentRow, currentCol]);

  const getDestination = (canvas: HTMLCanvasElement, e: any) => {
    if (!Array.isArray(tileMap) || tileMap.length < 1 || tileMap[0].length < 1)
      return;

    let rect = canvas.getBoundingClientRect();

    let newX = e.clientX - rect.left;
    let newY = e.clientY - rect.top;

    mouseScreenX = newX;
    mouseScreenY = newY;

    let mouseTilePos = convertScreenToTile(
      mouseScreenX - mapOffsetX,
      mouseScreenY - mapOffsetY
    );

    mouseTileX = mouseTilePos.x;
    mouseTileY = mouseTilePos.y;

    return { x: mouseTilePos.x, y: mouseTilePos.y };
  };

  const hdlMouseUp = (e: any, canvas: any) => {
    if (mouseDown && !isDragging && e.button === 0) {
      const dest = getDestination(canvas, e); // * only if its a click, thus ignoring a drag
      setLocations([{ x: dest?.x ?? 0, y: dest?.y ?? 0 }]);
    }

    mouseDown = false; // Reset mouseDown state
    isDragging = false; // Reset dragging flag
    return false;
  };

  const updateCanvasSize = () => {
    console.log("resizing ....");
    const width = window.innerWidth;
    let newWidth, newHeight;

    if (width >= 1024) {
      setMapOffset({ x: 320, y: 180 });
      // Large screens
      newWidth = 740;
      newHeight = 710;
    } else if (width >= 500) {
      setMapOffset({ x: 210, y: 80 });
      // Medium screens
      newWidth = 560; // Example size for medium
      newHeight = 560; // Example size for medium
    } else {
      setMapOffset({ x: 140, y: -40 });
      newWidth = 360;
      newHeight = 360;
    }

    setCanvasSize({ width: newWidth, height: newHeight });
  };

  useEffect(() => {
    updateCanvasSize(); // Set initial canvas size

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.height = canvasSize.height;
    canvas.width = canvasSize.width;

    const ctx = canvas?.getContext("2d");

    canvas.addEventListener("mousemove", (e) => hdlMouseMove(e, canvas));
    canvas.addEventListener("mouseup", (e) => hdlMouseUp(e, canvas));
    canvas.addEventListener("mousedown", (e) => hdlMouseDown(e, canvas));
    window.addEventListener("resize", updateCanvasSize);

    // Whenever locations change, redraw
    if (ctx) {
      draw(ctx, locations, resources.images.tileMap.imgElem);
    }

    return () => {
      canvas.removeEventListener("mousemove", (e) => hdlMouseMove(e, canvas));
      canvas.removeEventListener("mouseup", (e) => hdlMouseUp(e, canvas));
      canvas.removeEventListener("mousedown", (e) => hdlMouseDown(e, canvas));
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
      // ! without requestAnimationFrame simply call
      // draw(ctx, locations, resources.images.tileMap.imgElem);

      const drawFrame = () => {
        draw(ctx, locations, resources.images.tileMap.imgElem);
        requestAnimationFrame(drawFrame);
      };

      drawFrame();
    }
  }, [locations, canvasSize, userId, roomInfo]);

  return (
    <div className="flex items-center justify-center">
      <RoomData currentRow={currentRow} currentCol={currentCol} />
      <canvas ref={canvasRef} />
    </div>
  );
};
