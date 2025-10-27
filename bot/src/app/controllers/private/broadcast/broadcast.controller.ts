import type {
  MessageContextMenuCommandInteraction,
  MessageCreateOptions,
} from "discord.js";
import { ApplicationCommandType } from "discord.js";
import { ContextMenu, Discord } from "discordx";
import { singleton } from "tsyringe";

@singleton()
@Discord()
export class BroadcastController {
  @ContextMenu({
    name: "Broadcast",
    guilds: ["1419608270959808554", "1391117548036165752"],
    defaultMemberPermissions: ["Administrator"],
    type: ApplicationCommandType.Message,
  })
  async handleBroadcast(interaction: MessageContextMenuCommandInteraction) {
    await interaction.deferReply();
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
        const owner = guild.members.cache.get(guild.ownerId);

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
