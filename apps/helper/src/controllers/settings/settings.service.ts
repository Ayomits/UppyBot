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
  RoleSelectMenuBuilder,
  type RoleSelectMenuInteraction,
  StringSelectMenuBuilder,
  type StringSelectMenuInteraction,
} from "discord.js";
import { injectable } from "tsyringe";

import { EmbedBuilder } from "#/libs/embed/embed.builder.js";
import { HelperBotMessages } from "#/messages/index.js";
import { type Settings, SettingsModel } from "#/models/settings.model.js";

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
      };

      actionHandlers[interaction.customId]?.(interaction);
    });
  }

  // =============Главная панель==============
  private async buildMainSettingsPanel(
    interaction: Interaction
  ): Promise<InteractionEditReplyOptions> {
    const settings = await this.getOrCreateSettings(interaction.guildId);

    const embed = new EmbedBuilder()
      .setTitle(HelperBotMessages.settings.panel.title)
      .setFields(HelperBotMessages.settings.panel.fields(settings))
      .setDefaults(interaction.user);

    const controls = new ActionRowBuilder<ButtonBuilder>().addComponents(
      this.createChannelManagementButton(),
      this.createRoleManagementButton(),
      this.createRefreshButton()
    );

    return { embeds: [embed], components: [controls] };
  }

  private createChannelManagementButton() {
    return new ButtonBuilder()
      .setLabel(HelperBotMessages.settings.panel.buttons.managers.channels)
      .setCustomId(SettingsCustomIds.buttons.managers.channels)
      .setStyle(ButtonStyle.Secondary);
  }

  private createRoleManagementButton() {
    return new ButtonBuilder()
      .setLabel(HelperBotMessages.settings.panel.buttons.managers.roles)
      .setCustomId(SettingsCustomIds.buttons.managers.roles)
      .setStyle(ButtonStyle.Secondary);
  }

  private createRefreshButton() {
    return new ButtonBuilder()
      .setLabel(HelperBotMessages.settings.panel.buttons.updaters.panel)
      .setCustomId(SettingsCustomIds.buttons.updaters.panel)
      .setStyle(ButtonStyle.Secondary);
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
    interaction: Interaction
  ): Promise<InteractionEditReplyOptions> {
    const settings = await this.getOrCreateSettings(interaction.guildId);

    const embed = new EmbedBuilder()
      .setTitle(HelperBotMessages.settings.managers.channels.embed.title)
      .setFields(
        HelperBotMessages.settings.managers.channels.embed.fields(settings)
      )
      .setDefaults(interaction.user);

    const channelFieldSelector =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(SettingsCustomIds.selects.managers.channels)
          .setOptions(
            ...HelperBotMessages.settings.managers.channels.select.options
          )
          .setPlaceholder(
            HelperBotMessages.settings.managers.channels.select.placeholder
          )
      );

    return { embeds: [embed], components: [channelFieldSelector] };
  }

  private async handleChannelFieldSelection(
    interaction: StringSelectMenuInteraction
  ) {
    await interaction.deferUpdate();

    const channelSelector =
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(SettingsCustomIds.selects.actions.channel.action)
          .setChannelTypes(ChannelType.GuildText)
          .setPlaceholder(
            HelperBotMessages.settings.managers.channels.select.actions.channel
          )
      );

    const backward = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(SettingsCustomIds.selects.actions.channel.backward)
        .setLabel(
          HelperBotMessages.settings.managers.channels.buttons.backward.label
        )
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.editReply({ components: [channelSelector, backward] });
  }

  private async handleChannelSelection(
    interaction: ChannelSelectMenuInteraction,
    field: ObjectKeys<Settings>
  ) {
    await interaction.deferUpdate();

    await SettingsModel.updateOne(
      { guildId: interaction.guildId },
      { [field]: interaction.values[0] }
    );

    await interaction.editReply(
      await this.buildChannelManagementPanel(interaction)
    );
  }

  private async handleChannelBackward(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    await interaction.editReply(
      await this.buildChannelManagementPanel(interaction)
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
    interaction: Interaction
  ): Promise<InteractionEditReplyOptions> {
    const settings = await this.getOrCreateSettings(interaction.guildId);

    const embed = new EmbedBuilder()
      .setTitle(HelperBotMessages.settings.managers.roles.embed.title)
      .setFields(
        HelperBotMessages.settings.managers.roles.embed.fields(settings)
      )
      .setDefaults(interaction.user);

    const roleFieldSelector =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(SettingsCustomIds.selects.managers.roles)
          .setOptions(
            ...HelperBotMessages.settings.managers.roles.select.options
          )
          .setPlaceholder(
            HelperBotMessages.settings.managers.roles.select.placeholder
          )
      );

    return { embeds: [embed], components: [roleFieldSelector] };
  }

  private async handleRoleFieldSelection(
    interaction: StringSelectMenuInteraction,
    field: ObjectKeys<Settings>
  ) {
    const settings = await this.getOrCreateSettings(interaction.guildId);
    await interaction.deferUpdate();

    const roleSelector = new RoleSelectMenuBuilder()
      .setCustomId(SettingsCustomIds.selects.actions.role.action)
      .setPlaceholder(
        HelperBotMessages.settings.managers.roles.select.actions.role
      );

    const backward = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(SettingsCustomIds.selects.actions.role.backward)
        .setLabel(
          HelperBotMessages.settings.managers.roles.buttons.backward.label
        )
        .setStyle(ButtonStyle.Danger)
    );

    if (MULTIPLE_ROLE_SELECT_FIELDS.includes(field)) {
      roleSelector.setMaxValues(25);
      const currentRoles = settings[field] as string[];
      if (currentRoles.length > 0) {
        roleSelector.setDefaultRoles(currentRoles.slice(0, 25));
      }
    }

    await interaction.editReply({
      components: [
        new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
          roleSelector
        ),
        backward,
      ],
    });
  }

  private async handleRoleSelection(
    interaction: RoleSelectMenuInteraction,
    field: ObjectKeys<Settings>
  ) {
    await interaction.deferUpdate();

    const newValue =
      interaction.values.length > 1
        ? interaction.values
        : interaction.values[0];

    await SettingsModel.updateOne(
      { guildId: interaction.guildId },
      { [field]: newValue }
    );

    await interaction.editReply(
      await this.buildRoleManagementPanel(interaction)
    );
  }

  private async handleRoleBackward(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    await interaction.editReply(
      await this.buildRoleManagementPanel(interaction)
    );
  }

  // ============Утилитарные методы=========
  private async getOrCreateSettings(guildId: string) {
    return await SettingsModel.findOneAndUpdate(
      { guildId },
      {},
      { upsert: true, new: true }
    );
  }

  private async refreshSettingsPanel(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    await interaction.editReply(await this.buildMainSettingsPanel(interaction));
  }
}
