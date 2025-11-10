import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Interaction,
  InteractionEditReplyOptions,
} from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  chatInputApplicationCommandMention,
  ContainerBuilder,
  heading,
  HeadingLevel,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  time,
  TimestampStyles,
  userMention,
} from "discord.js";
import { DateTime } from "luxon";
import { injectable } from "tsyringe";

import type { RemindDocument } from "#/db/models/remind.model.js";
import { RemindModel } from "#/db/models/remind.model.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";
import { createSafeCollector } from "#/libs/utils/collector.js";

import {
  getBotByRemindType,
  getCommandIdByRemindType,
  getCommandNameByRemindType,
  MonitoringBot,
  MonitoringType,
} from "../../reminder/reminder.const.js";
import { StaffCustomIds } from "../stats.const.js";
import { BaseUppyService } from "../stats.service.js";

@injectable()
export class UppyRemainingService extends BaseUppyService {
  async handleRemainingCommand(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const repl = await interaction.editReply(
      await this.buildRemaining(interaction)
    );

    const collector = createSafeCollector(repl, {
      filter: (i) => i.user.id === interaction.user.id,
    });

    collector.on("collect", (interaction) => {
      const customId = interaction.customId;

      const handlers = {
        [StaffCustomIds.remaining.buttons.updaters.updateRemaining]:
          this.handleUpdateRemaining.bind(this),
      };

      return handlers[customId]?.(interaction);
    });
  }

  private async handleUpdateRemaining(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    await interaction.editReply(await this.buildRemaining(interaction));
  }

  private async buildRemaining(
    interaction: Interaction
  ): Promise<InteractionEditReplyOptions> {
    const [
      discordMonitoring,
      sdcMonitoring,
      serverMonitoring,
      disboardMonitoring,
    ] = await Promise.all([
      this.fetchMonitoringBot(
        interaction.guild!,
        MonitoringBot.DiscordMonitoring
      ),
      this.fetchMonitoringBot(interaction.guild!, MonitoringBot.SdcMonitoring),
      this.fetchMonitoringBot(
        interaction.guild!,
        MonitoringBot.ServerMonitoring
      ),
      this.fetchMonitoringBot(
        interaction.guild!,
        MonitoringBot.DisboardMonitoring
      ),
    ]);

    const types: MonitoringType[] = [];

    if (discordMonitoring) {
      types.push(MonitoringType.DiscordMonitoring);
    }

    if (sdcMonitoring) {
      types.push(MonitoringType.SdcMonitoring);
    }

    if (serverMonitoring) {
      types.push(MonitoringType.ServerMonitoring);
    }

    if (disboardMonitoring) {
      types.push(MonitoringType.DisboardMonitoring);
    }

    const monitorings = await RemindModel.find({
      type: { $in: types },
      guildId: interaction.guildId,
    })
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(types.length);

    const monitoringsMap = Object.fromEntries(
      monitorings.map((m) => [m.type, m as RemindDocument])
    );

    const updateButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("Обновить информацию")
        .setCustomId(StaffCustomIds.remaining.buttons.updaters.updateRemaining)
        .setStyle(ButtonStyle.Secondary)
    );

    const container = new ContainerBuilder()
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                heading("Статус мониторингов", HeadingLevel.Two),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.buildMonitoringStatuses(monitoringsMap as any),
              ].join("\n")
            )
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder().setURL(
              UsersUtility.getAvatar(interaction.user)
            )
          )
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents(updateButton);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  private buildMonitoringStatus(monitoring?: RemindDocument) {
    if (!monitoring) return "Нет данных";

    const timestamp = DateTime.fromJSDate(monitoring.timestamp).toMillis();

    const curr = DateTime.now().toMillis();

    const dsTimestamp = Math.floor(timestamp / 1_000);

    return curr > timestamp
      ? `${chatInputApplicationCommandMention(getCommandNameByRemindType(monitoring.type)!, getCommandIdByRemindType(monitoring.type)!)}`
      : `${time(dsTimestamp, TimestampStyles.RelativeTime)} ${time(dsTimestamp, TimestampStyles.LongTime)}`;
  }

  private buildMonitoringStatuses(
    monitorings: Record<string, RemindDocument>
  ): string {
    const values: string[] = [];

    for (const key in monitorings) {
      const monitoring = monitorings[key];
      values.push(
        `${userMention(getBotByRemindType(Number(key))!)}: ${this.buildMonitoringStatus(monitoring)}`
      );
    }

    if (values.length === 0) {
      return "Нет мониторингов на сервере";
    }

    return values.join("\n");
  }
}
