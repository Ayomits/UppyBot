import { createCanvas } from "@napi-rs/canvas";

import { AppThemes, getBannerName } from "#/discord/const/themes.js";

import { BaseThemingService } from "./base.service.js";

type BannerOptions = {
  memberCount: number;
  serversCount: number;
  theme: string;
};

export class BannerService extends BaseThemingService {
  constructor() {
    super();
  }

  static create() {
    return new BannerService();
  }

  async draw(options: BannerOptions) {
    const canvas = createCanvas(1700, 600);
    const ctx = canvas.getContext("2d");

    const bannerName = getBannerName(options.theme ?? AppThemes.Green);
    const bg = await this.loadImage(bannerName!);
    ctx.drawImage(bg, 0, 0);

    await this.loadFont("Onest-Extrabold.ttf", "Onest-Extrabold");

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#ffffff";
    ctx.font = "48px Onest-Extrabold";
    ctx.textAlign = "left";

    const baseX = 1001;
    const baseY = 174;

    ctx.lineWidth = 3;

    ctx.strokeText(
      options.serversCount.toLocaleString(),
      baseX + 119,
      baseY + 65,
    );
    ctx.fillText(
      options.serversCount.toLocaleString(),
      baseX + 119,
      baseY + 65,
    );

    ctx.strokeText(
      options.memberCount.toLocaleString(),
      baseX + 119,
      baseY + 160 + 45,
    );
    ctx.fillText(
      options.memberCount.toLocaleString(),
      baseX + 119,
      baseY + 160 + 45,
    );

    return canvas.toBuffer("image/png");
  }
}
