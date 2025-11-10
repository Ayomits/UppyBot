import { Events } from "discord.js";
import { Discord, On } from "discordx";
import { inject, singleton } from "tsyringe";

import { WebLikeSyncManager } from "#/loops/like.js";

@singleton()
@Discord()
export class LoopController {
  constructor(
    @inject(WebLikeSyncManager) private likeLoop: WebLikeSyncManager,
  ) {}

  @On({ event: Events.ClientReady })
  handleReady() {
    this.likeLoop.create();
  }
}
