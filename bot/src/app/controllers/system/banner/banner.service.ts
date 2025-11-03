import { dirname } from "@discordx/importer";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import type { Client } from "discordx";
import path from "path";
import { injectable } from "tsyringe";
import { pathToFileURL } from "url";

@injectable()
export class BannerService {
  async sendBanner(client: Client) {
    const guilds = client.guilds.cache;
    let memberCount = 0;
    for (const [, guild] of guilds) {
      memberCount += guild.memberCount;
    }

    client.user
      ?.setBanner(await this.drawBanner(guilds.size, memberCount))
      .catch(null);
  }

  private async drawBanner(guilds: number, members: number) {
    const canvas = createCanvas(680, 240);
    const ctx = canvas.getContext("2d");

    const root = `../../../../../..`;

    const bannerPath = path.join(
      dirname(import.meta.url),
      `${root}/assets/images/banner.png`,
    );

    const fontPath = path.join(
      dirname(import.meta.url),
      `${root}/assets/fonts/Onest-ExtraBold.ttf`,
    );

    GlobalFonts.registerFromPath(fontPath, "onest-extrabold");

    ctx.fillStyle = "black";
    ctx.strokeStyle = "#000000";
    ctx.font = "18px onest-extrabold";
    ctx.textAlign = "left";

    ctx.fillText("Hello world", 20, 20, 20);

    const bannerImage = await loadImage(pathToFileURL(bannerPath));

    ctx.drawImage(bannerImage, 0, 0);

    ctx.fillText(guilds.toString(), 530, 108);
    ctx.fillText(members.toString(), 530, 158);

    return canvas.toBuffer("image/png");
  }
}
