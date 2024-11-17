import { useEffect, useRef } from "react";
import { resources } from "./resources";
import { FacingDirection } from "../../types";
import { RoomI } from "./RoomOld";
import { useSelector } from "react-redux";
import { getRoomInfo, getUserId } from "../../state/room.reducer";
import { updatePosition } from "../wsHandler";
import { sleep } from "../../lib/misc";

export const Room = () => {
  const gameLoopRef = useRef<any>(null);
  const roomInfo = useSelector(getRoomInfo);
  const userId = useSelector(getUserId);

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
  let currentCharacterImage = resources.images.lghostie.imgElem;

  let currentRow = 0;
  let currentCol = 0;

  let context: CanvasRenderingContext2D | null = null;
  const canvasWidth = 740;
  const canvasHeight = 710;
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    var viewportRows = Math.ceil(canvasWidth / projectedTileWidth);
    var viewportCols = Math.ceil(canvasHeight / projectedTileHeight);

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

  const drawCharacterAt = (img: HTMLImageElement, x: number, y: number) => {
    if (!context) return;

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

    context.drawImage(
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

  const getFacingDirection = (from: any, to: any): any => {
    let updatedXAxis: FacingDirection = FacingDirection.Right;

    const deltaRow = to.row - from.row;
    const deltaCol = to.col - from.col;

    // Compare column values
    if (deltaCol > 0) updatedXAxis = FacingDirection.Right;
    else if (deltaCol < 0) updatedXAxis = FacingDirection.Left;

    // Diagonal movement
    if (Math.abs(deltaRow) === Math.abs(deltaCol)) {
      if (deltaCol > 0 && deltaRow < 0) updatedXAxis = FacingDirection.Right;
      else if (deltaCol < 0 && deltaRow > 0)
        updatedXAxis = FacingDirection.Left;
    }

    return updatedXAxis;
  };

  const draw = () => {
    if (!context) return;

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

        for (let user of roomInfo.Users) {
          drawCharacterAt(
            currentCharacterImage,
            user.Position.Row - 1,
            user.Position.Col - 1
          );
        }

        context.drawImage(
          resources.images.tileMap.imgElem,
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

    drawCursor(context);
  };

  const drawCursor = async (context: CanvasRenderingContext2D) => {
    let screenPos = convertTileToScreen(mouseTileX, mouseTileY);
    let screenX = screenPos.x;
    let screenY = screenPos.y;

    // output the tile location of the mouse
    context.font = "bold 12px Tahoma";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#13f0aa";

    let textX = screenX + projectedTileWidth / 2;
    let textY = screenY + projectedTileHeight / 2;

    let text = "(" + mouseTileX + ", " + mouseTileY + ")";

    context.fillText(text, textX, textY);
  };

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

    // console.log(`Destination: ${mouseTileX},${mouseTileY}`);
  };

  const onMouseMove = (canvas: HTMLCanvasElement, e: any) => {
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

  const hdlMouseMove = (e: any, canvas: any) => {
    if (mouseDown) {
      const dx = e.clientX - mouseScreenX; // distance moved in X
      const dy = e.clientY - mouseScreenY; // distance moved in Y

      // * check if the mouse has moved beyond the drag threshold
      if (Math.sqrt(dx * dx + dy * dy) > dragThreshold) {
        isDragging = true;
      }
    }

    onMouseMove(canvas, e);
  };

  const hdlMouseUp = (e: any, canvas: any) => {
    if (mouseDown && !isDragging && e.button === 0) {
      getDestination(canvas, e); // * only if its a click, thus ignoring a drag
    }

    mouseDown = false; // Reset mouseDown state
    isDragging = false; // Reset dragging flag
    return false;
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

    const prevRow = currentRow;
    const prevCol = currentCol;

    currentRow = mouseTileX;
    currentCol = mouseTileY;

    if (roomInfo.RoomId && userId) {
      console.log(`Destination: ${currentRow},${currentCol}`);
      updatePosition(roomInfo.RoomId, userId, currentRow, currentCol);
    }

    // TODO: move this to backend
    if (
      getFacingDirection(
        { row: prevRow, col: prevCol },
        { row: currentRow, col: currentCol }
      ) === 1
    ) {
      console.log("to right");
      currentCharacterImage = resources.images.rghostie.imgElem;
    } else {
      console.log("to left");
      currentCharacterImage = resources.images.lghostie.imgElem;
    }
  };

  const init = async () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      console.log("canvas not found");
      return;
    }

    canvas.height = canvasHeight;
    canvas.width = canvasWidth;

    context = canvas.getContext("2d", {
      willReadFrequently:
        true /* improve performance for chrome browser: https://www.schiener.io/2024-08-02/canvas-willreadfrequently */,
    });

    if (!context) return;

    // ! clearViewport();
    // ! displayLoading(context);

    canvas.removeEventListener("mousemove", (e) => hdlMouseMove(e, canvas));
    canvas.removeEventListener("mouseup", (e) => hdlMouseUp(e, canvas));
    canvas.removeEventListener("mousedown", (e) => hdlMouseDown(e, canvas));

    canvas.addEventListener("mousemove", (e) => hdlMouseMove(e, canvas));
    canvas.addEventListener("mouseup", (e) => hdlMouseUp(e, canvas));
    canvas.addEventListener("mousedown", (e) => hdlMouseDown(e, canvas));

    updateMapOffset(320, 180);

    gameLoopRef.current = new RoomI(
      context,
      canvasWidth,
      canvasHeight,
      () => {},
      () => draw()
    );

    gameLoopRef.current.start();
  };

  useEffect(() => {
    init();

    return () => {
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
        gameLoopRef.current = null; // Clear the reference
      }
    };
  }, [draw]);

  return (
    <div>
      <canvas ref={canvasRef}>
        Your browser does not support HTML Canvas.
      </canvas>
    </div>
  );
};
