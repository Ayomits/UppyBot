import type {
  Interaction,
  InteractionEditReplyOptions,
  StringSelectMenuInteraction,
} from "discord.js";
import {
  ButtonStyle,
  channelMention,
  type ChatInputCommandInteraction,
  ContainerBuilder,
  heading,
  HeadingLevel,
  MessageFlags,
  quote,
  roleMention,
  StringSelectMenuBuilder,
} from "discord.js";
import { inject, injectable } from "tsyringe";

import { UsersUtility } from "#/libs/embed/users.utility.js";
import { createSafeCollector } from "#/libs/utils/collector.js";
import type { SettingsDocument } from "#/models/settings-v2.model.js";
import { SettingsModel } from "#/models/settings-v2.model.js";

import { BotInviteService } from "../../bot/interactions/bot-invite.service.js";
import { ReminderScheduleManager } from "../../reminder/reminder-schedule.manager.js";
import type { SettingsConfig } from "./settings.const.js";
import { SettingsPipelines } from "./settings.const.js";
import { SettingsIds, SettingsNavigation } from "./settings.const.js";

@injectable()
export class SettingsService extends BotInviteService {
  constructor(
    @inject(ReminderScheduleManager)
    private scheduleManager: ReminderScheduleManager,
  ) {
    super();
  }

  public async handleSettingsCommand(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const repl = await interaction.editReply(
      await this.buildMessage(interaction, "roles"),
    );

    const collector = createSafeCollector(repl);

    collector.on("collect", (interaction) => {
      const customId = interaction.customId;

      const handlers = {
        [SettingsIds.navigation]: this.handleNavigation.bind(this),
      };

      return handlers[customId](interaction);
    });
  }

  private async handleNavigation(interaction: StringSelectMenuInteraction) {
    await interaction.deferUpdate();
    interaction
      .editReply(
        await this.buildMessage(
          interaction,
          interaction.values[0] as keyof typeof SettingsPipelines,
        ),
      )
      .catch(null);
  }

  private async buildMessage(
    interaction: Interaction,
    pipelineName: keyof typeof SettingsPipelines,
  ): Promise<InteractionEditReplyOptions> {
    const [main, settings, navigation] = [
      this.buildMainContainer(interaction),
      await this.buildSettingsContainer(interaction, pipelineName),
      this.buildNavigationContainer(),
    ];

    return {
      components: [main, settings, navigation],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: {
        users: [],
        roles: [],
      },
    };
  }

  private buildMainContainer(interaction: Interaction): ContainerBuilder {
    const container = new ContainerBuilder()
      .addSectionComponents((builder) =>
        builder
          .setThumbnailAccessory((builder) =>
            builder.setURL(UsersUtility.getAvatar(interaction.client.user)),
          )
          .addTextDisplayComponents((builder) =>
            builder.setContent(
              [
                heading("Настройки Uppy"),
                "",
                "В этой панели вы сможете удобно настроить uppy",
              ].join("\n"),
            ),
          ),
      )
      .addActionRowComponents(this.buildResourcesLinks());
    return container;
  }

  private buildNavigationContainer(): ContainerBuilder {
    const container = new ContainerBuilder().addActionRowComponents((builder) =>
      builder.addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(SettingsIds.navigation)
          .setPlaceholder("Выберите раздел")
          .setOptions(SettingsNavigation),
      ),
    );
    return container;
  }

  private async buildSettingsContainer(
    interaction: Interaction,
    pipelineName: keyof typeof SettingsPipelines,
  ): Promise<ContainerBuilder> {
    const pipeline = SettingsPipelines[pipelineName]!;
    const container = new ContainerBuilder().addTextDisplayComponents(
      (builder) =>
        builder.setContent(
          heading(this.resolveNavigationName(pipelineName), HeadingLevel.Two),
        ),
    );
    const settings = await SettingsModel.findOneAndUpdate(
      { guildId: interaction.guildId },
      {},
      { upsert: true },
    );

    for (const key in pipeline) {
      const config = pipeline[key]!;
      container.addSectionComponents((builder) =>
        builder
          .setButtonAccessory((builder) =>
            builder
              .setLabel("Изменить")
              .setStyle(ButtonStyle.Primary)
              .setCustomId(`${SettingsIds.change}_${key}`),
          )
          .addTextDisplayComponents((builder) =>
            builder.setContent(
              [
                quote(`${config.label}`),
                this.resolveValue(settings!, config.field, config.type),
              ].join("\n"),
            ),
          ),
      );
    }

    return container;
  }

  private resolveNavigationName(name: keyof typeof SettingsPipelines) {
    switch (name) {
      case "roles":
        return "Настройки ролей";
      case "channels":
        return "Настройки каналов";
      case "points":
        return "Настройки системы поинтов";
      case "reminds":
        return "Настройки системы напоминаний";
      case "kd":
        return "Настройка кд системы";
    }
    return "";
  }

  private resolveValue(
    settings: SettingsDocument,
    field: string,
    type: SettingsConfig["type"],
  ) {
    if (!settings) {
      return "Нет";
    }
    const value = settings[field];
    switch (type) {
      case "channel":
      case "role":
        return this.resolveMentions(value, type);
      case "toggle":
        return value ? "Включен" : "Выключен";
      case "value":
        if (typeof value === "number") {
          return value.toString();
        }
        return !value ? "Нет" : value;
    }
  }

  private resolveMention(type: SettingsConfig["type"]) {
    if (type === "channel") {
      return channelMention;
    }
    return roleMention;
  }

  private resolveMentions(
    value: string[] | string | null | undefined,
    type: SettingsConfig["type"],
  ): string {
    if (!value || value?.length === 0) {
      return "Нет";
    }
    const mentionFn = this.resolveMention(type);
    return Array.isArray(value)
      ? value.map((v) => mentionFn(v)).join("\n")
      : mentionFn(value);
  }
}
