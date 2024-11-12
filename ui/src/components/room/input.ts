export class Input {
  mouseDown: boolean;
  isDragging: boolean;
  dragThreshold: number;

  constructor() {
    this.mouseDown = false;
    this.isDragging = false;
    this.dragThreshold = 5;

    let mouseScreenX = 0;
    let mouseScreenY = 0;

    document.addEventListener("mousedown", (e) => {
      console.log("mousedown");
      if (e.button === 0) {
        // * left mouse button is pressed
        this.mouseDown = true;
        this.isDragging = false;

        const dx = e.clientX - mouseScreenX; // distance moved in X
        const dy = e.clientY - mouseScreenY; // distance moved in Y

        console.log(dx, dy);
      }

      return false;
    });

    document.addEventListener("mousemove", (e) => {
      console.log("mousemove");

      if (this.mouseDown) {
        const dx = e.clientX - mouseScreenX; // distance moved in X
        const dy = e.clientY - mouseScreenY; // distance moved in Y

        // * check if the mouse has moved beyond the drag threshold
        if (Math.sqrt(dx * dx + dy * dy) > this.dragThreshold) {
          this.isDragging = true;
        }
      }

      // onMouseMove(canvas, e);
    });

    document.addEventListener("mouseup", (e) => {
      console.log("mouseup");

      if (this.mouseDown && !this.isDragging && e.button === 0) {
        // getDestination(canvas, e); // * only if its a click, thus ignoring a drag
      }

      this.mouseDown = false; // Reset mouseDown state
      this.isDragging = false; // Reset dragging flag
      return false;
    });
  }
}
