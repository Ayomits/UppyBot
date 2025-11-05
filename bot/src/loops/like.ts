import { parse } from "node-html-parser";

import { fetchServer } from "#/api/ds-monitoring/api.js";
import { GuildRepository } from "#/db/repositories/guild.repository.js";

import type { Loop } from "./__interface.js";

export class LikeLoop implements Loop {
  async create() {
    const guilds = ["531970658633252864", "532331179760812033"];
    for (const guild of guilds) {
      console.log(await this.parseHtml(guild));
    }
  }

  private async parseHtml(guildId: string) {
    const { data: html } = await fetchServer(guildId);
    const obj = parse(html, {
      parseNoneClosedTags: false,
    });
    const main = obj.querySelector("main");
    const lastLike = main?.querySelector(".last-like");
    const logsMain = lastLike?.querySelector(".logs");
    const logs = logsMain?.querySelectorAll(".log");

    const users: { id: string; isSite: boolean; timestamp: string }[] = [];

    for (const log of logs ?? []) {
      const [usr, action] = log.querySelectorAll(".col");
      const timestamp = log
        .querySelector(".like_time")
        ?.getAttribute("data-unix");
      const [, , userId] = usr.text.split(" ");
      const isSite = action.text.includes("discordserver.info");
      users.push({ id: userId, isSite, timestamp: timestamp! });
    }

    return users;
  }

  async task(): Promise<void> {
    const guildRepository = GuildRepository.create();
    const guilds = await guildRepository.findMany({ isActive: true });
  }
}
