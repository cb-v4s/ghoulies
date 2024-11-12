export class RoomX {
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
