import { createSafeCollector, type ObjectKeys } from "@fear/utils";
import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  type ChannelSelectMenuInteraction,
  ChannelType,
  type ChatInputCommandInteraction,
  type GuildMember,
  type Interaction,
  type InteractionEditReplyOptions,
  type Message,
  ModalBuilder,
  type ModalSubmitInteraction,
  RoleSelectMenuBuilder,
  type RoleSelectMenuInteraction,
  StringSelectMenuBuilder,
  type StringSelectMenuInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { injectable } from "tsyringe";

import { EmbedBuilder } from "#/libs/embed/embed.builder.js";
import { HelperSettingsMessage } from "#/messages/index.js";
import {
  PointSettingsModel,
  safePointConfig,
} from "#/models/points-settings.model.js";
import { type Settings, SettingsModel } from "#/models/settings.model.js";

import {
  MonitoringCooldownHours,
  PointsRate,
  RemindType,
} from "../reminder/reminder.const.js";
import {
  MULTIPLE_ROLE_SELECT_FIELDS,
  SettingsCustomIds,
} from "./settings.const.js";

@injectable()
export class SettingsService {
  public async handleSettingsCommand(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const message = await this.buildMainSettingsPanel(interaction);
    const reply = await interaction.editReply(message);

    this.setupSettingsCollector(reply);
  }

  private setupSettingsCollector(message: Message) {
    const collector = createSafeCollector(message, {
      filter: (i) => (i.member as GuildMember).permissions.has("Administrator"),
    });

    collector.on("collect", (interaction) => {
      const actionHandlers = {
        [SettingsCustomIds.buttons.updaters.panel]:
          this.refreshSettingsPanel.bind(this),
        [SettingsCustomIds.buttons.managers.channels]:
          this.openChannelManagement.bind(this),
        [SettingsCustomIds.buttons.managers.roles]:
          this.openRoleManagement.bind(this),
        [SettingsCustomIds.buttons.actions.setForceTime]:
          this.openSetForceModal.bind(this),
        [SettingsCustomIds.buttons.actions.toggleUseForce]:
          this.toggleUseForceOnly.bind(this),
        [SettingsCustomIds.buttons.managers.award]:
          this.openAwardManagement.bind(this),
      };

      actionHandlers[interaction.customId]?.(interaction);
    });
  }

  // =============Главная панель==============
  private async buildMainSettingsPanel(
    interaction: Interaction,
  ): Promise<InteractionEditReplyOptions> {
    const settings = await this.getOrCreateSettings(interaction.guildId);

    const embed = new EmbedBuilder()
      .setTitle(HelperSettingsMessage.panel.title)
      .setFields(HelperSettingsMessage.panel.fields(settings))
      .setDefaults(interaction.user);

    const controls = [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        this.createChannelManagementButton(),
        this.createRoleManagementButton(),
        this.createRefreshButton(),
        this.createForceRemindButton(),
        this.createUseForceButton(),
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        this.createAwardManageButton(),
      ),
    ];

    return { embeds: [embed], components: controls };
  }

  private createChannelManagementButton() {
    return new ButtonBuilder()
      .setLabel(HelperSettingsMessage.panel.components.managers.channels)
      .setCustomId(SettingsCustomIds.buttons.managers.channels)
      .setStyle(ButtonStyle.Secondary);
  }

  private createRoleManagementButton() {
    return new ButtonBuilder()
      .setLabel(HelperSettingsMessage.panel.components.managers.roles)
      .setCustomId(SettingsCustomIds.buttons.managers.roles)
      .setStyle(ButtonStyle.Secondary);
  }

  private createForceRemindButton() {
    return new ButtonBuilder()
      .setLabel(HelperSettingsMessage.panel.components.actions.setForceTime)
      .setCustomId(SettingsCustomIds.buttons.actions.setForceTime)
      .setStyle(ButtonStyle.Secondary);
  }

  private createRefreshButton() {
    return new ButtonBuilder()
      .setLabel(HelperSettingsMessage.panel.components.updaters.panel)
      .setCustomId(SettingsCustomIds.buttons.updaters.panel)
      .setStyle(ButtonStyle.Secondary);
  }

  private createUseForceButton() {
    return new ButtonBuilder()
      .setLabel(HelperSettingsMessage.panel.components.actions.toggleUseForce)
      .setCustomId(SettingsCustomIds.buttons.actions.toggleUseForce)
      .setStyle(ButtonStyle.Secondary);
  }

  private createAwardManageButton() {
    return new ButtonBuilder()
      .setLabel(HelperSettingsMessage.panel.components.managers.award)
      .setCustomId(SettingsCustomIds.buttons.managers.award)
      .setStyle(ButtonStyle.Secondary);
  }

  //===============Преждевременный пинг

  private async toggleUseForceOnly(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const existed = await SettingsModel.findOneAndUpdate(
      { guildId: interaction.guildId },
      {},
      { upsert: true },
    );

    await SettingsModel.updateOne(
      { _id: existed.id },
      { useForceOnly: !existed.useForceOnly },
    );

    return interaction.editReply({
      content:
        HelperSettingsMessage.managers.force.buttons.actions.useForceOnly.content(
          !existed.useForceOnly,
        ),
    });
  }

  private openSetForceModal(interaction: ButtonInteraction) {
    const modal = new ModalBuilder()
      .setTitle(HelperSettingsMessage.panel.components.actions.setForceTime)
      .setCustomId(SettingsCustomIds.modal.setForceTime);

    const time = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setLabel("Количество секунд")
        .setPlaceholder("Введите количество секунд")
        .setCustomId("time")
        .setRequired(true)
        .setStyle(TextInputStyle.Short),
    );

    return interaction.showModal(modal.addComponents(time));
  }

  public async handleSetForceModal(interaction: ModalSubmitInteraction) {
    const fieldSeconds = Number(interaction.fields.getTextInputValue("time"));
    let seconds: number;
    if (Number.isNaN(fieldSeconds)) {
      seconds = 0;
    } else {
      seconds = fieldSeconds;
    }

    seconds = Math.min(
      Math.max(0, seconds),
      3_600 * MonitoringCooldownHours - 2,
    );

    await SettingsModel.findOneAndUpdate(
      {
        guildId: interaction.guildId,
      },
      {
        force: seconds,
      },
    );

    return interaction.reply({
      content:
        HelperSettingsMessage.managers.force.modal.actions.setForceTime.content,
      ephemeral: true,
    });
  }

  //==============Управление каналами=============
  private async openChannelManagement(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const message = await this.buildChannelManagementPanel(interaction);
    const reply = await interaction.editReply(message);

    this.setupChannelManagementCollector(reply);
  }

  private setupChannelManagementCollector(message: Message) {
    const collector = createSafeCollector(message, {
      filter: (i) => i.memberPermissions.has("Administrator"),
    });

    let selectedField: ObjectKeys<Settings> | null = null;

    collector.on("collect", (interaction) => {
      if (interaction.isStringSelectMenu()) {
        selectedField = interaction.values[0] as ObjectKeys<Settings>;
        this.handleChannelFieldSelection(interaction);
      } else if (interaction.isChannelSelectMenu()) {
        this.handleChannelSelection(interaction, selectedField!);
      } else if (interaction.isButton()) {
        this.handleChannelBackward(interaction);
      }
    });
  }

  private async buildChannelManagementPanel(
    interaction: Interaction,
  ): Promise<InteractionEditReplyOptions> {
    const settings = await this.getOrCreateSettings(interaction.guildId);

    const embed = new EmbedBuilder()
      .setTitle(HelperSettingsMessage.managers.channels.embed.title)
      .setFields(HelperSettingsMessage.managers.channels.embed.fields(settings))
      .setDefaults(interaction.user);

    const channelFieldSelector =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(SettingsCustomIds.selects.managers.channels)
          .setOptions(...HelperSettingsMessage.managers.channels.select.options)
          .setPlaceholder(
            HelperSettingsMessage.managers.channels.select.placeholder,
          ),
      );

    return { embeds: [embed], components: [channelFieldSelector] };
  }

  private async handleChannelFieldSelection(
    interaction: StringSelectMenuInteraction,
  ) {
    await interaction.deferUpdate();

    const channelSelector =
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(SettingsCustomIds.selects.actions.channel.action)
          .setChannelTypes(ChannelType.GuildText)
          .setPlaceholder(
            HelperSettingsMessage.managers.channels.select.actions.channel,
          ),
      );

    const backward = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(SettingsCustomIds.selects.actions.channel.backward)
        .setLabel(
          HelperSettingsMessage.managers.channels.buttons.backward.label,
        )
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.editReply({ components: [channelSelector, backward] });
  }

  private async handleChannelSelection(
    interaction: ChannelSelectMenuInteraction,
    field: ObjectKeys<Settings>,
  ) {
    await interaction.deferUpdate();

    await SettingsModel.updateOne(
      { guildId: interaction.guildId },
      { [field]: interaction.values[0] },
    );

    await interaction.editReply(
      await this.buildChannelManagementPanel(interaction),
    );
  }

  private async handleChannelBackward(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    await interaction.editReply(
      await this.buildChannelManagementPanel(interaction),
    );
  }

  // ==============Управление ролями====================
  private async openRoleManagement(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const message = await this.buildRoleManagementPanel(interaction);
    const reply = await interaction.editReply(message);

    this.setupRoleManagementCollector(reply);
  }

  private setupRoleManagementCollector(message: Message) {
    const collector = createSafeCollector(message, {
      filter: (i) => i.memberPermissions.has("Administrator"),
    });

    let selectedField: ObjectKeys<Settings> | null = null;

    collector.on("collect", (interaction) => {
      if (interaction.isStringSelectMenu()) {
        selectedField = interaction.values[0] as ObjectKeys<Settings>;
        this.handleRoleFieldSelection(interaction, selectedField);
      } else if (interaction.isRoleSelectMenu()) {
        this.handleRoleSelection(interaction, selectedField!);
      } else if (interaction.isButton()) {
        this.handleRoleBackward(interaction);
      }
    });
  }

  private async buildRoleManagementPanel(
    interaction: Interaction,
  ): Promise<InteractionEditReplyOptions> {
    const settings = await this.getOrCreateSettings(interaction.guildId);

    const embed = new EmbedBuilder()
      .setTitle(HelperSettingsMessage.managers.roles.embed.title)
      .setFields(HelperSettingsMessage.managers.roles.embed.fields(settings))
      .setDefaults(interaction.user);

    const roleFieldSelector =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(SettingsCustomIds.selects.managers.roles)
          .setOptions(...HelperSettingsMessage.managers.roles.select.options)
          .setPlaceholder(
            HelperSettingsMessage.managers.roles.select.placeholder,
          ),
      );

    return { embeds: [embed], components: [roleFieldSelector] };
  }

  private async handleRoleFieldSelection(
    interaction: StringSelectMenuInteraction,
    field: ObjectKeys<Settings>,
  ) {
    const settings = await this.getOrCreateSettings(interaction.guildId);
    await interaction.deferUpdate();

    const roleSelector = new RoleSelectMenuBuilder()
      .setCustomId(SettingsCustomIds.selects.actions.role.action)
      .setPlaceholder(HelperSettingsMessage.managers.roles.select.actions.role);

    const backward = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(SettingsCustomIds.selects.actions.role.backward)
        .setLabel(HelperSettingsMessage.managers.roles.buttons.backward.label)
        .setStyle(ButtonStyle.Danger),
    );

    if (MULTIPLE_ROLE_SELECT_FIELDS.includes(field)) {
      roleSelector.setMaxValues(25);
      const currentRoles = settings[field] as string[];
      if (currentRoles && currentRoles?.length > 0) {
        roleSelector.setDefaultRoles(
          currentRoles
            .filter((r) => interaction.guild.roles.cache.get(r))
            .slice(0, 25),
        );
      }
    }

    await interaction.editReply({
      components: [
        new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
          roleSelector,
        ),
        backward,
      ],
    });
  }

  private async handleRoleSelection(
    interaction: RoleSelectMenuInteraction,
    field: ObjectKeys<Settings>,
  ) {
    await interaction.deferUpdate();

    const newValue =
      interaction.values.length > 1
        ? interaction.values
        : interaction.values[0];

    await SettingsModel.updateOne(
      { guildId: interaction.guildId },
      { [field]: newValue },
    );

    await interaction.editReply(
      await this.buildRoleManagementPanel(interaction),
    );
  }

  private async handleRoleBackward(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    await interaction.editReply(
      await this.buildRoleManagementPanel(interaction),
    );
  }

  // ============Управлять наградами========

  private async openAwardManagement(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const repl = await interaction.editReply(
      await this.buildAwardManagementMessage(interaction),
    );

    const collector = createSafeCollector(repl);

    collector.on("collect", (interaction) => {
      const customId = interaction.customId;

      const handlers = {
        [SettingsCustomIds.selects.actions.award.action]:
          this.openAwardManagmentModal.bind(this),
      };

      return handlers[customId](interaction);
    });
  }

  private async buildAwardManagementMessage(interaction: ButtonInteraction) {
    const entries = await PointSettingsModel.find({
      guildId: interaction.guildId,
      type: { $in: Object.values(RemindType) },
    });

    const config = {
      sdc: entries.find((e) => e.type === RemindType.SdcMonitoring) ?? {
        default: PointsRate[RemindType.SdcMonitoring],
        bonus: PointsRate.night,
      },
      server: entries.find((e) => e.type === RemindType.ServerMonitoring) ?? {
        default: PointsRate[RemindType.ServerMonitoring],
        bonus: PointsRate.night,
      },
      ds: entries.find((e) => e.type === RemindType.DiscordMonitoring) ?? {
        default: PointsRate[RemindType.DiscordMonitoring],
        bonus: PointsRate.night,
      },
    };

    const embed = new EmbedBuilder()
      .setFields(
        {
          name: "> Sdc monitoring",
          value: [
            `Стандартно: ${config.sdc.default}`,
            `Бонус: ${config.sdc.bonus}`,
          ].join("\n"),
        },
        {
          name: "> Discord monitoring",
          value: [
            `Стандартно: ${config.ds?.default}`,
            `Бонус: ${config?.ds?.bonus}`,
          ].join("\n"),
        },
        {
          name: "> Server monitoring",
          value: [
            `Стандартно: ${config.server?.default}`,
            `Бонус: ${config?.server?.bonus}`,
          ].join("\n"),
        },
      )
      .setDefaults(interaction.user);

    const select =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(SettingsCustomIds.selects.actions.award.action)
          .setOptions(
            {
              label: "Sdc monitoring",
              value: `${RemindType.SdcMonitoring}`,
            },
            {
              label: "Discord monitoring",
              value: `${RemindType.DiscordMonitoring}`,
            },
            {
              label: "Server monitoring",
              value: `${RemindType.ServerMonitoring}`,
            },
          ),
      );

    return {
      embeds: [embed],
      components: [select],
    };
  }

  private async openAwardManagmentModal(
    interaction: StringSelectMenuInteraction,
  ) {
    const type_ = Number(interaction.values[0]);
    const entry = await safePointConfig(interaction.guildId, type_);

    const modal = new ModalBuilder()
      .setTitle("Управление наградами")
      .setCustomId(SettingsCustomIds.modal.manageAward);

    const defaultAmount =
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("default")
          .setLabel("Обычное кол-во")
          .setRequired(true)
          .setValue(entry.default.toString())
          .setStyle(TextInputStyle.Short),
      );
    const bonusAmount = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("bonus")
        .setLabel("Бонусное кол-во")
        .setRequired(true)
        .setValue(entry.bonus.toString())
        .setStyle(TextInputStyle.Short),
    );
    const type = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId("type")
        .setLabel("Мониторинг")
        .setValue(type_.toString())
        .setRequired(true)
        .setStyle(TextInputStyle.Short),
    );

    modal.addComponents(defaultAmount, bonusAmount, type);

    interaction.showModal(modal);
  }

  async handleAwardManagmentModal(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ ephemeral: true });
    let [default_, bonus] = [
      Number(interaction.fields.getTextInputValue("default")),
      Number(interaction.fields.getTextInputValue("bonus")),
    ];

    const type = Number(interaction.fields.getTextInputValue("type"));

    default_ = Math.max(0, default_);
    bonus = Math.max(0, bonus);

    if (
      Number.isNaN(type) ||
      !Object.values(RemindType).includes(type as RemindType)
    ) {
      return interaction.editReply({
        content: "Такого мониторинга не существует",
      });
    }

    await PointSettingsModel.findOneAndUpdate(
      {
        guildId: interaction.guildId,
        type,
      },
      {
        default: default_,
        bonus,
      },
      { upsert: true },
    );

    return interaction.editReply({
      content: "Настройки успешно применены",
    });
  }

  // ============Утилитарные методы=========
  private async getOrCreateSettings(guildId: string) {
    return await SettingsModel.findOneAndUpdate(
      { guildId },
      {},
      { upsert: true, new: true },
    );
  }

  private async refreshSettingsPanel(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    await interaction.editReply(await this.buildMainSettingsPanel(interaction));
  }
}
