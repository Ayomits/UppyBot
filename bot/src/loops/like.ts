import { parse } from "node-html-parser";

import { fetchServer } from "#/api/ds-monitoring/api.js";
import { GuildRepository } from "#/db/repositories/guild.repository.js";

import type { Loop } from "./__interface.js";

export class LikeLoop implements Loop {
  async create() {
    const { data: html } = await fetchServer("532331179760812033");
    const obj = parse(html, {
      parseNoneClosedTags: false,
    });
  }

  async task(): Promise<void> {
    const guildRepository = GuildRepository.create();
    const guilds = await guildRepository.findMany({ isActive: true });
  }
}
