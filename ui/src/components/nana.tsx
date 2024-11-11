import React, { useEffect, useRef } from "react";
import { themeColor } from "../siteConfig";

export const Nana = () => {
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
  const canvasWidth = 1240;
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

  // The range of tiles to render based on visibility.
  // Will be updated as map is dragged around.
  let renderStartX = 0;
  let renderStartY = 0;
  let renderFinishX = 0;
  let renderFinishY = 0;

  // How many tile sprites are on each row of the sprite sheet?
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

  const clearViewport = (context: CanvasRenderingContext2D, color: string) => {
    context.fillStyle = color;
    context.fillRect(0, 0, canvasWidth, canvasHeight);
  };

  const displayLoading = (context: CanvasRenderingContext2D) => {
    context.textAlign = "center";
    context.fillStyle = "red";
    context.font = "26px Tahoma";

    var textX = canvasWidth / 2;
    var textY = canvasHeight / 2;

    context.fillText("Loading assets...", textX, textY);
  };

  // delete
  const displayFinished = (context: CanvasRenderingContext2D) => {
    context.textAlign = "center";
    context.fillStyle = "blue";
    context.font = "26px Tahoma";

    var textX = canvasWidth / 2;
    var textY = canvasHeight / 2;

    context.fillText("The end...", textX, textY);
  };

  const loadImage = (url: string) => {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = url;
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

  const mainLoop = (
    context: CanvasRenderingContext2D,
    img: HTMLImageElement
  ) => {
    clearViewport(context, themeColor);
    draw(context, img);

    window.requestAnimationFrame(() => {
      mainLoop(context, img);
    });
  };

  const convertTileToScreen = (tileX: number, tileY: number) => {
    const isoX = tileX - tileY;
    const isoY = tileX + tileY;

    const screenX = mapOffsetX + isoX * (tileWidth / 2 - overlapWidth);
    const screenY = mapOffsetY + isoY * (tileHeight / 2 - overlapHeight);

    return { x: screenX, y: screenY };
  };

  const draw = (context: CanvasRenderingContext2D, img: HTMLImageElement) => {
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

        context.drawImage(
          img,
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

    drawCursor(context, img);
  };

  const drawCursor = (
    context: CanvasRenderingContext2D,
    img: HTMLImageElement
  ) => {
    let screenPos = convertTileToScreen(mouseTileX, mouseTileY);
    let screenX = screenPos.x;
    let screenY = screenPos.y;

    // to save images, the mouse cursor is just a tile sprite
    var drawTile = 15;

    var spriteWidth = blockWidth + 2 * spritePadding;
    var spriteHeight = blockHeight + 2 * spritePadding;

    var srcX = (drawTile % spriteColumns) * spriteWidth + spritePadding;
    var srcY =
      Math.floor(drawTile / spriteColumns) * spriteHeight + spritePadding;

    context.drawImage(
      img,
      srcX,
      srcY,
      blockWidth,
      blockHeight,
      screenX,
      screenY,
      blockWidth,
      blockHeight
    );

    // output the tile location of the mouse
    context.font = "bold 11px Tahoma";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#F15A24";

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

    alert(`Destination: ${mouseTileX},${mouseTileY}`);
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

  const init = async () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      console.log("canvas not found");
      return;
    }

    canvas.height = canvasHeight;
    canvas.width = canvasWidth;

    const context = canvas.getContext("2d");

    if (!context) return;

    clearViewport(context, "#060814");
    displayLoading(context);

    const tileSheetURL = "/tilemap.png";
    const tileSheetImg = await loadImage(tileSheetURL);

    console.log("init ~ tileSheetImg:", tileSheetImg);

    if (!tileSheetImg) {
      console.log("couldn't load tilesheet");
      return;
    }

    canvas.onmousedown = (e) => {
      if (e.button === 0) {
        // * left mouse button is pressed
        mouseDown = true;
        isDragging = false;
      }

      return false;
    };

    canvas.onmousemove = (e) => {
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

    canvas.onmouseup = (e) => {
      if (mouseDown && !isDragging && e.button === 0) {
        getDestination(canvas, e); // * only if its a click ignoring a drag
      }

      mouseDown = false; // Reset mouseDown state
      isDragging = false; // Reset dragging flag
      return false;
    };

    updateMapOffset(550, 80);
    mainLoop(context, tileSheetImg as HTMLImageElement);
    displayFinished(context);
  };

  useEffect(() => {
    init();
  });

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
