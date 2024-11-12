import { useEffect, useRef } from "react";
import { themeColor } from "../../siteConfig";
import { resources } from "./resources";

export const Room = () => {
  // TODO: mover esto a otro lado
  class GameLoop {
    lastFrameTime: number;
    accumulatedTime: number;
    timeStep: number;
    update: any; // TODO: describe this
    render: any; // TODO: describe this
    rafId: number | null; // stands for RequestAnimationFrame Id
    isRunning: boolean;

    constructor(update: any, render: any) {
      this.lastFrameTime = 0;
      this.accumulatedTime = 0;
      this.timeStep = 1000 / 60; // 60 frames per second

      this.update = update;
      this.render = render;

      this.rafId = null;
      this.isRunning = false;
    }

    mainLoop = (timestamp: number) => {
      if (!this.isRunning) return;

      clearViewport(themeColor);

      let deltaTime = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;
      this.accumulatedTime += deltaTime;

      while (this.accumulatedTime >= this.timeStep) {
        this.update(this.timeStep);
        this.accumulatedTime -= this.timeStep;
      }

      this.render();
      this.rafId = requestAnimationFrame(this.mainLoop);
    };

    start() {
      if (!this.isRunning) {
        this.isRunning = true;
        this.rafId = requestAnimationFrame(this.mainLoop);
      }
    }

    stop() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }
      this.isRunning = false;
    }
  }

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

  let currentRow = 0;
  let currentCol = 0;

  let context: CanvasRenderingContext2D | null = null;
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

  let characterImg: HTMLImageElement | null = null;

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

  const clearViewport = (color: string) => {
    if (!context) return;

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

  // const mainLoop = (
  //   context: CanvasRenderingContext2D,
  //   img: HTMLImageElement
  // ) => {
  //   clearViewport(context, themeColor);
  //   draw(context);

  //   window.requestAnimationFrame(() => {
  //     mainLoop(context, img);
  //   });
  // };

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
    const destX = destPos.x;
    const destY = destPos.y;

    // Assuming the character image is a single sprite
    const srcX = 0;
    const srcY = 0;
    const srcWidth = img.width;
    const srcHeight = img.height;

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

  const draw = async () => {
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

        drawCharacterAt(
          resources.images.ghostie.imgElem as HTMLImageElement,
          currentRow - 1,
          currentCol - 1
        );

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

    // to save images, the mouse cursor is just a tile sprite
    var drawTile = 15;

    var spriteWidth = blockWidth + 2 * spritePadding;
    var spriteHeight = blockHeight + 2 * spritePadding;

    var srcX = (drawTile % spriteColumns) * spriteWidth + spritePadding;
    var srcY =
      Math.floor(drawTile / spriteColumns) * spriteHeight + spritePadding;

    context.drawImage(
      resources.images.tileMap.imgElem,
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

  const init = async () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      console.log("canvas not found");
      return;
    }

    canvas.height = canvasHeight;
    canvas.width = canvasWidth;

    context = canvas.getContext("2d");

    if (!context) return;

    clearViewport("#060814");
    displayLoading(context);

    canvas.onmousedown = (e) => {
      if (e.button === 0) {
        // * left mouse button is pressed
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

        currentRow = mouseTileX;
        currentCol = mouseTileY;

        console.log(`Destination: ${currentRow},${currentCol}`);
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
        getDestination(canvas, e); // * only if its a click, thus ignoring a drag
      }

      mouseDown = false; // Reset mouseDown state
      isDragging = false; // Reset dragging flag
      return false;
    };

    updateMapOffset(580, 180);

    const gameLoop = new GameLoop(
      () => {},
      () => draw()
    );

    gameLoop.start();

    // mainLoop(context, resources.images.tileMap.imgElem);
    // displayFinished(context);
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
