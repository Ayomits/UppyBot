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

import { RemindModel } from "#/db/models/remind.model.js";
import type { SettingsDocument } from "#/db/models/settings.model.js";
import { GuildRepository } from "#/db/repositories/guild.repository.js";
import { SettingsRepository } from "#/db/repositories/settings.repository.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";
import { getNestedValue } from "#/libs/json/nested.js";
import { CustomIdParser } from "#/libs/parser/custom-id.parser.js";
import { createSafeCollector } from "#/libs/utils/collector.js";

import { BotInviteService } from "../bot/interactions/bot-invite.service.js";
import { ReminderScheduleManager } from "../reminder/reminder-schedule.manager.js";
import type { SettingsConfig } from "./settings.const.js";
import { getSectionName, SettingsPipelines } from "./settings.const.js";
import { SettingsIds, SettingsNavigation } from "./settings.const.js";

@injectable()
export class SettingsService {
  constructor(
    @inject(ReminderScheduleManager)
    private scheduleManager: ReminderScheduleManager,
    @inject(BotInviteService) private botInviteService: BotInviteService,
    @inject(SettingsRepository) private settingsRepository: SettingsRepository,
    @inject(GuildRepository) private guildRepository: GuildRepository,
  ) {}

  // Основная команда настроек
  public async handleSettingsCommand(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const reply = await interaction.editReply(
      await this.buildMessage(interaction, "roles"),
    );

    const collector = createSafeCollector(reply);

    collector.on("collect", (interaction) => {
      const [baseId] = CustomIdParser.parseArguments(interaction.customId, {
        returnFull: true,
      });

      // Обработчики разных типов взаимодействий
      const handlers = {
        [SettingsIds.navigation]: this.handleNav.bind(this),
        [SettingsIds.change]: this.handleSettingChange.bind(this),
        [SettingsIds.refresh]: this.handleRefresh.bind(this),
      };

      return handlers[baseId]?.(interaction);
    });
  }

  // Навигация по разделам
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

  // Изменение конкретной настройки
  private async handleSettingChange(interaction: ButtonInteraction) {
    const [pipelineName, settingKey] = CustomIdParser.parseArguments(
      interaction.customId,
      {},
    );

    const pipeline = SettingsPipelines[pipelineName].pipeline;
    const config = pipeline[settingKey]! as SettingsConfig;

    // Выбираем обработчик в зависимости от типа настройки
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

  // Обновление панели
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

  // Переключение булевых настроек
  private async handleToggleSetting(
    interaction: ButtonInteraction,
    config: SettingsConfig,
    pipelineName: keyof typeof SettingsPipelines,
  ) {
    await interaction.deferUpdate();

    // Получаем текущие настройки
    const currentSettings = await this.settingsRepository.findGuildSettings(
      interaction.guildId!,
    );

    // Инвертируем значение
    const currentValue = getNestedValue(currentSettings, config.field);
    await this.settingsRepository.update(interaction.guildId!, {
      [config.field]: !currentValue,
    });

    // Обновляем панель
    await interaction.editReply(
      await this.buildMessage(interaction, pipelineName),
    );
    await this.postUpdateActions(interaction.guild!);
  }

  // Обработка выбора из селекта (каналы/роли)
  private async handleSelectSetting(
    interaction: ButtonInteraction,
    config: SettingsConfig,
  ) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const currentSettings = await this.settingsRepository.findGuildSettings(
      interaction.guildId!,
    );

    const currentValue = getNestedValue(currentSettings, config.field);

    // Создаем соответствующий селектор
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
        );
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

    // Мультивыбор если нужно
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

    // Коллектор для обработки выбора
    const collector = createSafeCollector(reply, {
      filter: (i) => (i.member as GuildMember).permissions.has("Administrator"),
    });

    collector.on(
      "collect",
      async (selectInteraction: StringSelectMenuInteraction) => {
        await selectInteraction.deferUpdate();
        const selectedValues = selectInteraction.values;

        // Обновляем настройки
        await this.settingsRepository.update(interaction.guildId!, {
          [config.field]:
            selectedValues.length === 0 && config.select?.choice === "single"
              ? null
              : selectedValues,
        });

        await selectInteraction.editReply({
          content: "Настройки успешно применены, обновите панель",
          components: [],
        });

        await this.postUpdateActions(selectInteraction.guild!);
      },
    );
  }

  // Фильтруем валидные значения для селекта
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

  // Показ модального окна
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

  // Действия после обновления настроек
  private async postUpdateActions(guild: Guild) {
    const guildId = guild.id;
    const settings = await this.settingsRepository.findGuildSettings(guildId);
    const reminds = await RemindModel.find({ guildId });

    // Управление напоминаниями в зависимости от настроек
    if (!settings?.remind.enabled) {
      return this.scheduleManager.deleteAll(guildId);
    }

    if (settings?.force.useForceOnly) {
      return this.scheduleManager.deleteAllCommonRemind(guildId);
    }

    if (settings?.force.seconds === 0 || !settings.force.enabled) {
      return this.scheduleManager.deleteAllForceRemind(guildId);
    }

    // Пересоздаем напоминания
    for (const remind of reminds) {
      this.scheduleManager.remind({
        guild,
        settings: settings!,
        type: remind.type!,
        timestamp: remind.timestamp,
      });
    }
  }

  // Построение основного сообщения с настройками
  private async buildMessage(
    interaction: Interaction,
    pipelineName: keyof typeof SettingsPipelines,
  ): Promise<InteractionEditReplyOptions> {
    const [header, settingsPanel, navPanel] = [
      this.buildHeader(interaction),
      await this.buildSettingsPanel(interaction, pipelineName),
      this.buildNavPanel(pipelineName),
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

  // Шапка панели настроек
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

  // Панель навигации
  private buildNavPanel(pipelineName: string): ContainerBuilder {
    const container = new ContainerBuilder().addActionRowComponents(
      (row) =>
        row.addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(SettingsIds.navigation)
            .setPlaceholder("Выберите раздел")
            .setOptions(SettingsNavigation),
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

  // Панель с настройками текущего раздела
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

    // Добавляем каждую настройку раздела
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

  // Форматирование значений для отображения
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

  // Выбор функции для упоминания
  private getMentionFn(type: SettingsConfig["type"]) {
    return type === "channel" ? channelMention : roleMention;
  }

  // Форматирование упоминаний
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
