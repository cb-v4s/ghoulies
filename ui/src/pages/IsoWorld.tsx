import React, { useRef, useState, useEffect } from "react";

interface IsoTile {
  x: number;
  y: number;
  type: number;
}

interface IsoWorldProps {
  viewportWidth: number;
  viewportHeight: number;
  tileSheetURI: string;
}

const IsoWorld: React.FC<IsoWorldProps> = ({
  viewportWidth,
  viewportHeight,
  tileSheetURI,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tileSheetImg, setTileSheetImg] = useState<HTMLImageElement | null>(
    null
  );
  const [tileMap, setTileMap] = useState<IsoTile[][]>([]);
  const [mapOffsetX, setMapOffsetX] = useState(0);
  const [mapOffsetY, setMapOffsetY] = useState(0);
  const [mouseDown, setMouseDown] = useState(false);
  const [mouseScreenX, setMouseScreenX] = useState(0);
  const [mouseScreenY, setMouseScreenY] = useState(0);
  const [mouseTileX, setMouseTileX] = useState(0);
  const [mouseTileY, setMouseTileY] = useState(0);
  const [renderStartX, setRenderStartX] = useState(0);
  const [renderStartY, setRenderStartY] = useState(0);
  const [renderFinishX, setRenderFinishX] = useState(0);
  const [renderFinishY, setRenderFinishY] = useState(0);
  const spriteColumns = 5;
  const spritePadding = 2;
  const blockWidth = 74;
  const blockHeight = 70;
  const tileWidth = 74;
  const tileHeight = 44;
  const overlapWidth = 2;
  const overlapHeight = 2;
  const projectedTileWidth = tileWidth - overlapWidth - overlapHeight;
  const projectedTileHeight = tileHeight - overlapWidth - overlapHeight;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = viewportWidth;
    canvas.height = viewportHeight;
    const context = canvas.getContext("2d");

    if (!context) return;

    clearViewport(context, "#1A1B1F");
    // showLoadingPlaceholder(context);

    loadImage(tileSheetURI)
      .then((img) => {
        setTileSheetImg(img);
        buildMap();
        canvas.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          return false;
        };
        canvas.oncontextmenu = (e) => {
          e.stopPropagation();
          e.preventDefault();
          return false;
        };
        canvas.onmouseup = (e) => {
          setMouseDown(false);
          return false;
        };
        canvas.onmousedown = (e) => {
          setMouseDown(true);
          return false;
        };
        canvas.onmousemove = (e) => {
          onMouseMove(e);
        };
        updateMapOffset(300, -100);
        mainLoop(context);
      })
      .catch((error) => {
        console.error("Error loading tile sheet:", error);
      });
  }, [viewportWidth, viewportHeight, tileSheetURI]);

  const clearViewport = (context: CanvasRenderingContext2D, color: string) => {
    context.fillStyle = color;
    context.fillRect(0, 0, viewportWidth, viewportHeight);
  };

  const showLoadingPlaceholder = (context: CanvasRenderingContext2D) => {
    context.font = "14px Tahoma";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#EEEEEE";
    const textX = viewportWidth / 2;
    const textY = viewportHeight / 2;
    context.fillText("LOADING ASSETS...", textX, textY);
  };

  const loadImage = (uri: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = uri;
    });
  };

  const buildMap = () => {
    const newTileMap: IsoTile[][] = [
      [
        { x: 0, y: 0, type: 1 },
        { x: 1, y: 0, type: 1 },
        { x: 2, y: 0, type: 1 },
        { x: 3, y: 0, type: 1 },
        { x: 4, y: 0, type: 1 },
        { x: 5, y: 0, type: 1 },
        { x: 6, y: 0, type: 1 },
        { x: 7, y: 0, type: 1 },
        { x: 8, y: 0, type: 1 },
        { x: 9, y: 0, type: 1 },
      ],
      [
        { x: 0, y: 1, type: 1 },
        { x: 1, y: 1, type: 1 },
        { x: 2, y: 1, type: 1 },
        { x: 3, y: 1, type: 1 },
        { x: 4, y: 1, type: 1 },
        { x: 5, y: 1, type: 1 },
        { x: 6, y: 1, type: 1 },
        { x: 7, y: 1, type: 1 },
        { x: 8, y: 1, type: 1 },
        { x: 9, y: 1, type: 1 },
      ],
      // ... rest of the map
    ];
    setTileMap(newTileMap);
  };

  const mainLoop = (context: CanvasRenderingContext2D) => {
    clearViewport(context, "#1A1B1F");
    draw(context);
    window.requestAnimationFrame(() => {
      mainLoop(context);
    });
  };

  const limit = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(value, max));
  };

  const convertScreenToTile = (
    screenX: number,
    screenY: number
  ): { x: number; y: number } => {
    const mappedX = screenX / projectedTileWidth;
    const mappedY = screenY / projectedTileHeight;
    const maxTileX = tileMap.length - 1;
    const maxTileY = tileMap.length > 0 ? tileMap[0].length - 1 : 0;
    const tileX = limit(Math.round(mappedX + mappedY) - 1, 0, maxTileX);
    const tileY = limit(Math.round(-mappedX + mappedY), 0, maxTileY);
    return { x: tileX, y: tileY };
  };

  const convertTileToScreen = (
    tileX: number,
    tileY: number
  ): { x: number; y: number } => {
    const isoX = tileX - tileY;
    const isoY = tileX + tileY;
    const screenX = mapOffsetX + isoX * (tileWidth / 2 - overlapWidth);
    const screenY = mapOffsetY + isoY * (tileHeight / 2 - overlapHeight);
    return { x: screenX, y: screenY };
  };

  const updateMapOffset = (deltaX: number, deltaY: number) => {
    setMapOffsetX((prevOffsetX) => prevOffsetX + deltaX);
    setMapOffsetY((prevOffsetY) => prevOffsetY + deltaY);
    const firstVisbleTile = convertScreenToTile(-mapOffsetX, -mapOffsetY);
    const firstVisibleTileX = firstVisbleTile.x;
    const firstVisibleTileY = firstVisbleTile.y;
    const viewportRows = Math.ceil(viewportWidth / projectedTileWidth);
    const viewportCols = Math.ceil(viewportHeight / projectedTileHeight);
    const maxVisibleTiles = viewportRows + viewportCols;
    const halfVisibleTiles = Math.ceil(maxVisibleTiles / 2);
    setRenderStartX(Math.max(firstVisibleTileX, 0));
    setRenderStartY(Math.max(firstVisibleTileY - halfVisibleTiles + 1, 0));
    setRenderFinishX(
      Math.min(firstVisibleTileX + maxVisibleTiles, tileMap.length - 1)
    );
    setRenderFinishY(
      Math.min(firstVisibleTileY + halfVisibleTiles + 1, tileMap[0].length - 1)
    );
  };

  const draw = (context: CanvasRenderingContext2D) => {
    for (let x = renderStartX; x <= renderFinishX; x++) {
      for (let y = renderStartY; y <= renderFinishY; y++) {
        const drawTile = tileMap[x][y].type;
        const srcX =
          (drawTile % spriteColumns) * (blockWidth + 2 * spritePadding) +
          spritePadding;
        const srcY =
          Math.floor(drawTile / spriteColumns) *
            (blockHeight + 2 * spritePadding) +
          spritePadding;
        const destPos = convertTileToScreen(x, y);
        const destX = destPos.x;
        const destY = destPos.y;
        const destWidth = blockWidth;
        const destHeight = blockHeight;
        if (tileSheetImg) {
          context.drawImage(
            tileSheetImg,
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
    }
    drawCursor(context);
  };

  const drawCursor = (context: CanvasRenderingContext2D) => {
    const screenPos = convertTileToScreen(mouseTileX, mouseTileY);
    const screenX = screenPos.x;
    const screenY = screenPos.y;
    const drawTile = 15;
    const srcX =
      (drawTile % spriteColumns) * (blockWidth + 2 * spritePadding) +
      spritePadding;
    const srcY =
      Math.floor(drawTile / spriteColumns) * (blockHeight + 2 * spritePadding) +
      spritePadding;
    if (tileSheetImg) {
      context.drawImage(
        tileSheetImg,
        srcX,
        srcY,
        blockWidth,
        blockHeight,
        screenX,
        screenY,
        blockWidth,
        blockHeight
      );
    }

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#F15A24";
    const textX = screenX + projectedTileWidth / 2;
    const textY = screenY + projectedTileHeight / 2;
    const text = `(${mouseTileX}, ${mouseTileY})`;
    context.fillText(text, textX, textY);
  };

  const onMouseMove = (e: any) => {
    if (!tileMap || tileMap.length < 1 || tileMap[0].length < 1) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const newX = e.clientX - rect.left;
    const newY = e.clientY - rect.top;
    const mouseDeltaX = newX - mouseScreenX;
    const mouseDeltaY = newY - mouseScreenY;
    setMouseScreenX(newX);
    setMouseScreenY(newY);
    const mouseTilePos = convertScreenToTile(
      mouseScreenX - mapOffsetX,
      mouseScreenY - mapOffsetY
    );
    setMouseTileX(mouseTilePos.x);
    setMouseTileY(mouseTilePos.y);
    if (mouseDown) {
      updateMapOffset(mouseDeltaX, mouseDeltaY);
    }
  };

  return <canvas ref={canvasRef} />;
};

export default IsoWorld;
