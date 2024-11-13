import { themeColor } from "../../siteConfig";

export class RoomI {
  context: CanvasRenderingContext2D;
  lastFrameTime: number;
  accumulatedTime: number;
  timeStep: number;
  update: any; // TODO: describe this
  render: any; // TODO: describe this
  rafId: number | null; // stands for RequestAnimationFrame Id
  isRunning: boolean;
  canvasWidth: number;
  canvasHeight: number;

  constructor(
    context: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    update: any,
    render: any
  ) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.context = context;
    this.lastFrameTime = 0;
    this.accumulatedTime = 0;
    this.timeStep = 1000 / 60; // 60 frames per second

    this.update = update;
    this.render = render;

    this.rafId = null;
    this.isRunning = false;
  }

  clearViewport = (color: string) => {
    if (!this.context) return;

    this.context.fillStyle = color;
    this.context.fillRect(
      0,
      0,
      this.canvasWidth + 500,
      this.canvasHeight + 500
    );
  };

  mainLoop = (timestamp: number) => {
    if (!this.isRunning) return;

    this.clearViewport(themeColor);

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
