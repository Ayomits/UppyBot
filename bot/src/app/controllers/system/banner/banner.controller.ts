import { Events } from "discord.js";
import type { ArgsOf, Client } from "discordx";
import { Discord, On } from "discordx";
import { inject, singleton } from "tsyringe";

import { BannerService } from "./banner.service.js";

@singleton()
@Discord()
export class BannerController {
  constructor(@inject(BannerService) private bannerService: BannerService) {}

  @On({ event: Events.ClientReady })
  init([client]: ArgsOf<Events.ClientReady>) {
    this.bannerService.sendBanner(client as Client);

    setInterval(
      () => this.bannerService.sendBanner(client as Client),
      1800 * 1_000,
    );
  }
}
