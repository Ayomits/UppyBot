import { createCanvas } from "@napi-rs/canvas";

import { AppThemes, getAvatarName } from "#/discord/const/themes.js";

import { BaseThemingService } from "./base.service.js";

type AvatarOptions = {
  theme: string;
};

export class AvatarService extends BaseThemingService {
  constructor() {
    super();
  }

  static create() {
    return new AvatarService();
  }

  async draw(options: AvatarOptions) {
    const canvas = createCanvas(512, 512);
    const ctx = canvas.getContext("2d");

    const avatarName = getAvatarName(options.theme ?? AppThemes.Green);

    const bg = await this.loadImage(avatarName!);

    ctx.drawImage(bg, 0, 0);

    return canvas.toBuffer("image/png");
  }
}
