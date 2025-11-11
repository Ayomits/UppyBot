import type {
  MessageContextMenuCommandInteraction,
  MessageCreateOptions,
} from "discord.js";
import { ApplicationCommandType, MessageFlags } from "discord.js";
import { ContextMenu, Discord, Guard } from "discordx";
import { singleton } from "tsyringe";

import { developerGuilds } from "#/discord/const/guilds.js";
import { SelectedGuildsOnly } from "#/discord/guards/only-selected-guilds.js";

@singleton()
@Discord()
export class BroadcastController {
  @ContextMenu({
    name: "Broadcast",
    guilds: developerGuilds,
    defaultMemberPermissions: ["Administrator"],
    type: ApplicationCommandType.Message,
  })
  @Guard(SelectedGuildsOnly(developerGuilds))
  async handleBroadcast(interaction: MessageContextMenuCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const client = interaction.client;
    const msg = interaction.targetMessage;
    const payload: MessageCreateOptions = {
      content: msg.content,
      embeds: msg.embeds,
      components: msg.components,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      flags: msg.flags as any,
    };
    let count: number = 0;
    await Promise.all(
      client.guilds.cache.map(async (guild) => {
        const owner = await guild.members.fetch(guild.ownerId).catch(null);

        if (!owner) {
          return;
        }

        try {
          await owner?.createDM(true);
          await owner?.send(payload);
          count += 1;
        } catch {
          // nothing here
        }
      }),
    );
    interaction.editReply({ content: `Выслано: ${count} овнерам` });
  }
}
