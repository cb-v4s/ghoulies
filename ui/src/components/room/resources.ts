interface Image {
  imgElem: HTMLImageElement;
  isLoaded: boolean;
}

export class Resources {
  imgSrcList: { [key: string]: string };
  images: { [key: string]: Image };

  constructor() {
    this.imgSrcList = {
      tileMap: "/sprites/tilemap.png",
      lghostie: "/sprites/lgosty.png",
      rghostie: "/sprites/rgosty.png",
    };

    this.images = {};

    // Load each image
    const imgKeys: string[] = Object.keys(this.imgSrcList);
    imgKeys.forEach((key: string) => {
      const img = new Image();
      img.src = this.imgSrcList[key];
      this.images[key] = {
        imgElem: img,
        isLoaded: false,
      };

      img.onload = () => {
        this.images[key].isLoaded = true;
      };
    });
  }
}

export const resources = new Resources();
