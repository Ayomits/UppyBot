import { dirname } from "@discordx/importer";
import { GlobalFonts, loadImage as loadCanvasImage } from "@napi-rs/canvas";
import { join } from "path";

export class BaseThemingService {
  private root = `../../../..`;

  protected async loadImage(path: string, external = false) {
    const resultPath = external
      ? path
      : join(dirname(import.meta.url), `${this.root}/${path}`);
    return await loadCanvasImage(resultPath);
  }

  protected async loadFont(name: string, alias?: string) {
    GlobalFonts.registerFromPath(
      join(dirname(import.meta.url), `${this.root}/assets/fonts/${name}`),
      alias
    );
  }
}
