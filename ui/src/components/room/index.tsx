import { useCallback, useEffect, useRef, useState } from "react";
import { resources } from "./resources";
import { useSelector } from "react-redux";
import { getRoomInfo, getUserId } from "@state/room.reducer";
import { updatePosition } from "@components/wsHandler";
import { RoomData } from "./roomData";
import { debounce, getImageResource } from "@lib/misc";
import { Canvas } from "./Canvas";

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
  let isDragging = false;
  let mouseDown = false;
  let mouseScreenX = 0;
  let mouseScreenY = 0;
  let mouseTileX = 0;
  let mouseTileY = 0;
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

  const draw = (ctx: any, imageRef: any) => {
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

    roomInfo.Users.forEach(({ Position, Direction, UserName, IsTyping }) => {
      drawCharacterAt({
        ctx,
        img: getImageResource(Direction, "ghost"),
        x: Position.Row - 1,
        y: Position.Col - 1,
        blockWidth: blockWidth + 90,
        blockHeight: blockHeight + 20,
        XPosPadding: 45,
        YPosPadding: 0,
        username: UserName,
        isTyping: IsTyping,
      });
    });
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

  const drawCharacterAt = ({
    ctx,
    img,
    x,
    y,
    blockWidth,
    blockHeight,
    XPosPadding,
    YPosPadding,
    username = null,
    isTyping = false,
  }: {
    ctx: CanvasRenderingContext2D;
    img: HTMLImageElement;
    x: number;
    y: number;
    blockWidth: number;
    blockHeight: number;
    XPosPadding: number;
    YPosPadding: number;
    username: string | null;
    isTyping: boolean;
  }) => {
    if (!ctx) return;

    const characterX = x;
    const characterY = y;

    // Calculate destination coordinates on the canvas
    const destPos = convertTileToScreen(characterX, characterY);
    const destX = destPos.x - XPosPadding;
    const destY = destPos.y - YPosPadding;

    // Assuming the character image is a single sprite
    const srcX = 0;
    const srcY = 0;
    const srcWidth = img.width;
    const srcHeight = img.height;

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

    if (isTyping) {
      const imgResource = resources.images.chatBubble.imgElem;
      ctx.drawImage(
        imgResource,
        srcX,
        srcY,
        imgResource.width,
        imgResource.height,
        destX + 45,
        destY - 12,
        45,
        36
      );
    }

    if (username) {
      ctx.font = "600 15px arial";
      ctx.textAlign = "center";
      ctx.fillStyle = "#DCDCE4";

      const textX = destX + blockWidth / 2;
      const textY = destY + blockHeight;

      ctx.fillText(username, textX, textY);
    }
  };

  const hdlMouseDown = (e: any, canvas: any) => {
    // * left mouse button is pressed
    if (e.button !== 0) return false;

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

    setCurrentRow(mouseTileX);
    setCurrentCol(mouseTileY);
  };

  const updatePositionDebounced = useCallback(
    debounce((roomId: string, userId: string, row: number, col: number) => {
      updatePosition(roomId, userId, row, col);
    }, 200),
    []
  );

  useEffect(() => {
    if (roomInfo.RoomId && userId) {
      updatePositionDebounced(roomInfo.RoomId, userId, currentRow, currentCol);
    }
  }, [currentRow, currentCol]);

  const getDestination = (canvas: HTMLCanvasElement, e: any) => {
    if (!Array.isArray(tileMap) || tileMap.length < 1 || tileMap[0].length < 1)
      return;

    let rect = canvas.getBoundingClientRect();
    let newX = e.clientX - rect.left;
    let newY = e.clientY - rect.top;

    let mouseTilePos = convertScreenToTile(
      newX - mapOffset.x,
      newY - mapOffset.y
    );

    const maxTileX = tileMap.length - 1;
    const maxTileY = tileMap[0].length - 1;

    if (
      mouseTilePos.x < 0 ||
      mouseTilePos.x > maxTileX ||
      mouseTilePos.y < 0 ||
      mouseTilePos.y > maxTileY
    ) {
      return null; // Out of bounds
    }

    return { x: mouseTilePos.x, y: mouseTilePos.y };
  };

  const hdlMouseUp = (e: any, canvas: any) => {
    if (mouseDown && !isDragging && e.button === 0) {
      const dest = getDestination(canvas, e);
      if (dest) {
        setLocations([{ x: dest.x, y: dest.y }]);
      }
    }

    mouseDown = false; // Reset mouseDown state
    isDragging = false; // Reset dragging flag
    return false;
  };

  const updateCanvasSize = () => {
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
      newHeight = 960; // Example size for medium
    } else {
      setMapOffset({ x: 140, y: 0 });
      newWidth = 360;
      newHeight = 440;
    }

    setCanvasSize({ width: newWidth, height: newHeight });
  };

  return (
    <div className="flex items-center justify-center">
      <RoomData currentRow={currentRow} currentCol={currentCol} />
      <Canvas
        userId={userId}
        roomInfo={roomInfo}
        canvasSize={canvasSize}
        draw={draw}
        locations={locations}
        mapOffset={mapOffset}
        onMouseDown={hdlMouseDown}
        onMouseUp={hdlMouseUp}
        resources={resources} // Pass any resources needed for drawing
        updateMapOffset={updateMapOffset}
        updateCanvasSize={updateCanvasSize}
      />
    </div>
  );
};
