import type {
  ButtonInteraction,
  Guild,
  GuildMember,
  Interaction,
  InteractionEditReplyOptions,
  StringSelectMenuInteraction,
} from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  channelMention,
  ChannelSelectMenuBuilder,
  type ChatInputCommandInteraction,
  ContainerBuilder,
  heading,
  HeadingLevel,
  MessageFlags,
  ModalBuilder,
  quote,
  roleMention,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { inject, injectable } from "tsyringe";

import { webhookEndpoint } from "#/discord/libs/telegram/index.js";
import { BumpBanModel } from "#/shared/db/models/uppy-discord/bump-ban.model.js";
import { GuildType } from "#/shared/db/models/uppy-discord/guild.model.js";
import { RemindModel } from "#/shared/db/models/uppy-discord/remind.model.js";
import type { SettingsDocument } from "#/shared/db/models/uppy-discord/settings.model.js";
import { GuildRepository } from "#/shared/db/repositories/uppy-discord/guild.repository.js";
import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { CryptographyService } from "#/shared/libs/crypto/index.js";
import { createSafeCollector } from "#/shared/libs/djs/collector.js";
import { UsersUtility } from "#/shared/libs/embed/users.utility.js";
import { getNestedValue } from "#/shared/libs/json/nested.js";
import { CustomIdParser } from "#/shared/libs/parser/custom-id.parser.js";

import { BotInviteService } from "../bot/interactions/bot-invite.service.js";
import { ReminderScheduleManager } from "../reminder/reminder-schedule.manager.js";
import {
  getSectionName,
  SettingsNavigation,
  SettingsPipelines,
} from "./settings.config.js";
import { SettingsIds, SettingsStartPipeline } from "./settings.const.js";
import type { SettingsConfig } from "./settings.types.js";

@injectable()
export class SettingsService {
  constructor(
    @inject(ReminderScheduleManager)
    private scheduleManager: ReminderScheduleManager,
    @inject(BotInviteService) private botInviteService: BotInviteService,
    @inject(SettingsRepository) private settingsRepository: SettingsRepository,
    @inject(GuildRepository) private guildRepository: GuildRepository,
    @inject(CryptographyService) private cryptography: CryptographyService,
  ) {}

  public async handleSettingsCommand(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const reply = await interaction.editReply(
      await this.buildMessage(interaction, SettingsStartPipeline),
    );

    const collector = createSafeCollector(reply);

    collector.on("collect", (interaction) => {
      const [baseId] = CustomIdParser.parseArguments(interaction.customId, {
        returnFull: true,
      });

      const handlers = {
        [SettingsIds.navigation]: this.handleNav.bind(this),
        [SettingsIds.change]: this.handleSettingChange.bind(this),
        [SettingsIds.refresh]: this.handleRefresh.bind(this),
      };

      return handlers[baseId]?.(interaction);
    });
  }

  private async handleNav(interaction: StringSelectMenuInteraction) {
    const pipelineName = interaction
      .values[0] as keyof typeof SettingsPipelines;

    const guild = await this.guildRepository.findGuild(interaction.guildId!);

    const config = SettingsPipelines[pipelineName];

    if (config.access > guild!.type) {
      return interaction.reply({
        content: "Ваш сервер недостаточно крут для этого функционала",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferUpdate();
    await interaction
      .editReply(await this.buildMessage(interaction, pipelineName))
      .catch(null);
  }

  private async handleSettingChange(interaction: ButtonInteraction) {
    const [pipelineName, settingKey] = CustomIdParser.parseArguments(
      interaction.customId,
      {},
    );

    const pipeline = SettingsPipelines[pipelineName].pipeline;
    const config = pipeline[settingKey]! as SettingsConfig;

    if (config.toggle) {
      return this.handleToggleSetting(
        interaction,
        config,
        pipelineName as keyof typeof SettingsPipelines,
      );
    }

    if (config.select) {
      return this.handleSelectSetting(interaction, config);
    }

    if (config.modal) {
      return this.handleModalSetting(interaction, config);
    }
  }

  private async handleRefresh(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    const [pipelineName] = CustomIdParser.parseArguments(
      interaction.customId,
      {},
    );
    await interaction.editReply(
      await this.buildMessage(
        interaction,
        pipelineName as keyof typeof SettingsPipelines,
      ),
    );
  }

  private async handleToggleSetting(
    interaction: ButtonInteraction,
    config: SettingsConfig,
    pipelineName: keyof typeof SettingsPipelines,
  ) {
    await interaction.deferUpdate();

    const currentSettings = await this.settingsRepository.findGuildSettings(
      interaction.guildId!,
    );

    const currentValue = getNestedValue(currentSettings, config.field);
    await this.settingsRepository.update(interaction.guildId!, {
      [config.field]: !currentValue,
    });

    await interaction.editReply(
      await this.buildMessage(interaction, pipelineName),
    );
    await this.postUpdateActions(interaction.guild!);
  }

  private async handleSelectSetting(
    interaction: ButtonInteraction,
    config: SettingsConfig,
  ) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const currentSettings = await this.settingsRepository.findGuildSettings(
      interaction.guildId!,
    );

    const currentValue = getNestedValue(currentSettings, config.field);

    let selector: ChannelSelectMenuBuilder | RoleSelectMenuBuilder =
      new ChannelSelectMenuBuilder();

    if (config.type === "channel") {
      selector = new ChannelSelectMenuBuilder()
        .setMinValues(0)
        .setMaxValues(1)
        .setDefaultChannels(
          this.getValidSelectValues(
            currentValue,
            interaction.guild!,
            "channel",
          ),
        )
        .setChannelTypes(config.select?.channelTypes ?? []);
    }

    if (config.type === "role") {
      selector = new RoleSelectMenuBuilder()
        .setPlaceholder(config.select!.placeholder)
        .setMinValues(0)
        .setMaxValues(1)
        .setDefaultRoles(
          this.getValidSelectValues(currentValue, interaction.guild!, "role"),
        );
    }

    if (config.select!.choice === "multi") {
      selector.setMaxValues(25);
    }

    selector
      .setCustomId(SettingsIds.select)
      .setPlaceholder(config.select!.placeholder);

    const reply = await interaction.editReply({
      components: [
        new ActionRowBuilder<typeof selector>().addComponents(selector),
      ],
    });

    const collector = createSafeCollector(reply, {
      filter: (i) => (i.member as GuildMember).permissions.has("Administrator"),
    });

    collector.on(
      "collect",
      async (selectInteraction: StringSelectMenuInteraction) => {
        await selectInteraction.deferUpdate();
        const values = selectInteraction.values;
        const selectedValue =
          config.select?.choice === "single" ? values[0] : values;

        await this.settingsRepository.update(interaction.guildId!, {
          [config.field]: selectedValue ?? null,
        });

        await selectInteraction.editReply({
          content: "Настройки успешно применены, обновите панель",
          components: [],
        });

        await this.postUpdateActions(selectInteraction.guild!);
      },
    );
  }

  private getValidSelectValues(
    value: string | string[],
    guild: Guild,
    type: "channel" | "role",
  ): string[] {
    if (!value) {
      return [];
    }

    const cache = type === "channel" ? guild.channels.cache : guild.roles.cache;

    return Array.isArray(value)
      ? value.filter((v) => cache.has(v))
      : [cache.has(value) ? value : ""].filter(Boolean);
  }

  private async handleModalSetting(
    interaction: ButtonInteraction,
    config: SettingsConfig,
  ) {
    const settings = await this.settingsRepository.findGuildSettings(
      interaction.guildId!,
    );

    const modal = new ModalBuilder()
      .setTitle(config.modal!.title)
      .setCustomId(config.modal!.customId)
      .setComponents(config.modal!.fields(settings!));

    return interaction.showModal(modal);
  }

  private async postUpdateActions(guild: Guild) {
    const guildId = guild.id;
    const settings = await this.settingsRepository.findGuildSettings(guildId);
    const reminds = await RemindModel.model.find({ guildId });

    const isForceDisabled =
      settings?.force.seconds === 0 || !settings.force.enabled;
    const isCommonDisabled = !settings?.remind.enabled;

    const isBumpBanDisabled = !settings.bumpBan?.enabled;

    if (isCommonDisabled) {
      this.scheduleManager.deleteAllReminds(guildId, "common");
    }

    if (isForceDisabled) {
      this.scheduleManager.deleteAllReminds(guildId, "force");
    }

    if (isBumpBanDisabled) {
      this.postUpdateBumpBan(guild);
    }

    this.postUpdateTelegramNotifications(guild, !!settings.telegram?.enabled);

    for (const remind of reminds) {
      this.scheduleManager.remind({
        guild,
        settings: settings!,
        type: remind.type!,
        timestamp: remind.timestamp,
      });
    }
  }

  private async postUpdateTelegramNotifications(
    guild: Guild,
    enabled: boolean = false,
  ) {
    await this.settingsRepository.update(guild.id, {
      webhooks: {
        url: !enabled ? null : webhookEndpoint,
        token: !enabled
          ? null
          : this.cryptography.encrypt(this.cryptography.encrypt(guild.id)),
      },
    });
  }

  private async postUpdateBumpBan(guild: Guild) {
    const bumpBanned = await BumpBanModel.model.find({ guildId: guild.id });

    for (const banned of bumpBanned) {
      const member = await guild.members.fetch(banned.userId).catch(() => null);

      if (!member) {
        return;
      }

      await member.roles.remove(banned.givenRoleId).catch(() => null);
    }
  }

  private async buildMessage(
    interaction: Interaction,
    pipelineName: keyof typeof SettingsPipelines,
  ): Promise<InteractionEditReplyOptions> {
    const [header, settingsPanel, navPanel] = [
      this.buildHeader(interaction),
      await this.buildSettingsPanel(interaction, pipelineName),
      await this.buildNavPanel(pipelineName, interaction.guildId!),
    ];

    return {
      components: [header, settingsPanel, navPanel],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: {
        users: [],
        roles: [],
      },
    };
  }

  private buildHeader(interaction: Interaction): ContainerBuilder {
    const container = new ContainerBuilder()
      .addSectionComponents((section) =>
        section
          .setThumbnailAccessory((thumb) =>
            thumb.setURL(UsersUtility.getAvatar(interaction.client.user)),
          )
          .addTextDisplayComponents((text) =>
            text.setContent(
              [
                heading("Настройки Uppy"),
                "",
                "В этой панели вы сможете удобно настроить uppy",
              ].join("\n"),
            ),
          ),
      )
      .addActionRowComponents(this.botInviteService.buildResourcesLinks());

    return container;
  }

  private async buildNavPanel(
    pipelineName: string,
    guildId: string,
  ): Promise<ContainerBuilder> {
    const guild = await this.guildRepository.findGuild(guildId);
    const container = new ContainerBuilder().addActionRowComponents(
      (row) =>
        row.addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(SettingsIds.navigation)
            .setPlaceholder("Выберите раздел")
            .setOptions(
              SettingsNavigation.filter((opt) => {
                if (opt.public) {
                  return true;
                }
                return guild.type >= GuildType.Developer;
              }),
            ),
        ),
      (row) =>
        row.addComponents(
          new ButtonBuilder()
            .setLabel("Обновить")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`${SettingsIds.refresh}_${pipelineName}`),
        ),
    );

    return container;
  }

  private async buildSettingsPanel(
    interaction: Interaction,
    pipelineName: keyof typeof SettingsPipelines,
  ): Promise<ContainerBuilder> {
    const pipelineConfig = SettingsPipelines[pipelineName]!;
    const container = new ContainerBuilder().addTextDisplayComponents((text) =>
      text.setContent(heading(getSectionName(pipelineName), HeadingLevel.Two)),
    );

    const settings = await this.settingsRepository.findGuildSettings(
      interaction.guildId!,
    );

    for (const key in pipelineConfig.pipeline) {
      const config = pipelineConfig.pipeline[key]!;
      container.addSectionComponents((section) =>
        section
          .setButtonAccessory((button) =>
            button
              .setLabel("Изменить")
              .setStyle(ButtonStyle.Primary)
              .setCustomId(`${SettingsIds.change}_${pipelineName}_${key}`),
          )
          .addTextDisplayComponents((text) =>
            text.setContent(
              [
                quote(`${config.label}`),
                config.display
                  ? config.display(settings!)
                  : this.formatValue(settings!, config.field, config.type),
              ].join("\n"),
            ),
          ),
      );
    }

    return container;
  }

  private formatValue(
    settings: SettingsDocument,
    field: string,
    type: SettingsConfig["type"],
  ) {
    if (!settings) {
      return "Нет";
    }

    const value = getNestedValue(settings, field);

    switch (type) {
      case "channel":
      case "role":
        return this.formatMentions(value, type);
      case "toggle":
        return value ? "Включен" : "Выключен";
      case "value":
        if (typeof value === "number") {
          return value.toString();
        }
        return !value ? "Нет" : value;
    }
  }

  private getMentionFn(type: SettingsConfig["type"]) {
    return type === "channel" ? channelMention : roleMention;
  }

  private formatMentions(
    value: string[] | string | null | undefined,
    type: SettingsConfig["type"],
  ): string {
    if (!value || value?.length === 0) {
      return "Нет";
    }

    const mentionFn = this.getMentionFn(type);

    return Array.isArray(value)
      ? value.map((v) => mentionFn(v)).join("\n")
      : mentionFn(value);
  }
}
