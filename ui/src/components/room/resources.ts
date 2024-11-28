import { FacingDirection } from "../../types";

interface Image {
  imgElem: HTMLImageElement;
  isLoaded: boolean;
}

export class Resources {
  imgSrcList: { [key: string]: string | object };
  images: { [key: string]: Image };

  constructor() {
    this.imgSrcList = {
      tileMap: "/sprites/tilemap.png",
      chatBubble: "/chatBubble.png",

      ghost: {
        [FacingDirection.frontLeft]: "/sprites/ghost/frontLeft.png",
        [FacingDirection.frontRight]: "/sprites/ghost/frontRight.png",
        [FacingDirection.backLeft]: "/sprites/ghost/backLeft.png",
        [FacingDirection.backRight]: "/sprites/ghost/backRight.png",
      },

      kitten: {
        [FacingDirection.frontLeft]: "/sprites/kitten/frontLeft.png",
        [FacingDirection.frontRight]: "/sprites/kitten/frontRight.png",
        [FacingDirection.backLeft]: "/sprites/kitten/backLeft.png",
        [FacingDirection.backRight]: "/sprites/kitten/backRight.png",
      },
    };

    this.images = {};
    this.loadImages();
  }

  private loadImages() {
    Object.keys(this.imgSrcList).forEach((j: string) => {
      const resource: any = this.imgSrcList[j];

      if (typeof resource === "string") {
        this.loadImage(j, resource);
      } else {
        Object.keys(resource).forEach((k: string) => {
          this.loadImage(`${j}.${k}`, resource[k]);
        });
      }
    });
  }

  private loadImage(key: string, src: string) {
    const img = new Image();
    img.src = src;

    this.images[key] = {
      imgElem: img,
      isLoaded: false,
    };

    img.onload = () => {
      this.images[key].isLoaded = true;
    };
  }
}

export const resources = new Resources();
