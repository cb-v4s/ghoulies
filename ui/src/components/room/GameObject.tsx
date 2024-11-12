interface Position {
  x: number;
  y: number;
}

export class GameObject {
  position: Position;
  children: any[];
  parent: any | null;
  hasReadyBeenCalled: boolean;

  constructor({ position }: { position: Position }) {
    this.position = position ?? { x: 0, y: 0 };
    this.children = [];
    this.parent = null;
    this.hasReadyBeenCalled = false;
  }

  // First entry point of the loop
  stepEntry(delta: any, root: any) {
    // Call updates on all children first
    this.children.forEach((child) => child.stepEntry(delta, root));

    // Call ready on the first frame
    if (!this.hasReadyBeenCalled) {
      this.hasReadyBeenCalled = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const drawPosX = x + this.position.x;
    const drawPosY = y + this.position.y;

    // Do the actual rendering for Images
    this.drawImage(ctx, drawPosX, drawPosY);

    // Pass on to children
    this.children.forEach((child) => child.draw(ctx, drawPosX, drawPosY));
  }

  drawImage(ctx: any, drawPosX: any, drawPosY: any) {
    //...
  }

  // Remove from the tree
  destroy() {
    this.children.forEach((child) => {
      child.destroy();
    });
    this.parent.removeChild(this);
  }

  /* Other Game Objects are nestable inside this one */
  addChild(gameObject: any) {
    gameObject.parent = this;
    this.children.push(gameObject);
  }

  removeChild(gameObject: any) {
    this.children = this.children.filter((g) => {
      return gameObject !== g;
    });
  }
}
