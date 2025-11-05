import { Events } from "discord.js";
import type { ArgsOf, Client} from "discordx";
import { Discord, On } from "discordx";
import { inject, singleton } from "tsyringe";

import { LikeLoop } from "#/loops/like.js";

@singleton()
@Discord()
export class LoopController {
  constructor(@inject(LikeLoop) private likeLoop: LikeLoop) {}

  @On({ event: Events.ClientReady })
  handleReady([client]: ArgsOf<Events.ClientReady>) {
    this.likeLoop.create(client as Client);
  }
}
