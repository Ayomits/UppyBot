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
  constructor() {}

  public async handleSettings(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const reply = await interaction.editReply(
      await this.createMainPanelMessage(interaction),
    );

    const collector = createSafeCollector(reply, {
      filter: (i) => (i.member as GuildMember).permissions.has("Administrator"),
    });

    collector.on("collect", (interaction) => {
      const customId = interaction.customId;

      const handlers = {
        [SettingsCustomIds.buttons.updaters.panel]:
          this.handleUpdateSettingsMessage.bind(this),
        [SettingsCustomIds.buttons.managers.channels]:
          this.handleManageChannels.bind(this),
        [SettingsCustomIds.buttons.managers.roles]:
          this.handleManageRoles.bind(this),
      };

      return handlers[customId]?.(interaction);
    });
  }

  private async handleUpdateSettingsMessage(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    await interaction.editReply(await this.createMainPanelMessage(interaction));
  }

  private async createMainPanelMessage(
    interaction: Interaction,
  ): Promise<InteractionEditReplyOptions> {
    const guildId = interaction.guildId;

    const settings = await this.fetchSettings(guildId);

    const embed = new EmbedBuilder()
      .setTitle(HelperBotMessages.settings.panel.title)
      .setFields(HelperBotMessages.settings.panel.fields(settings))
      .setDefaults(interaction.user);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(HelperBotMessages.settings.panel.buttons.managers.channels)
        .setCustomId(SettingsCustomIds.buttons.managers.channels)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel(HelperBotMessages.settings.panel.buttons.managers.roles)
        .setCustomId(SettingsCustomIds.buttons.managers.roles)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel(HelperBotMessages.settings.panel.buttons.updaters.panel)
        .setCustomId(SettingsCustomIds.buttons.updaters.panel)
        .setStyle(ButtonStyle.Secondary),
    );

    return {
      embeds: [embed],
      components: [row],
    };
  }

  //=================Управление каналами===============

  private async handleManageChannels(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const repl = await interaction.editReply(
      await this.createManageChannelsPanelMessage(interaction),
    );

    const collector = createSafeCollector(repl, {
      filter: (i) => i.memberPermissions.has("Administrator"),
    });

    let field: ObjectKeys<Settings> | null = null;

    collector.on("collect", (interaction) => {
      const customId = interaction.customId;

      if (customId === SettingsCustomIds.selects.managers.channels) {
        const inter = interaction as StringSelectMenuInteraction;
        field = inter.values[0] as ObjectKeys<Settings>;
        return this.handleManageChannelSelectType(inter);
      } else if (customId === SettingsCustomIds.selects.actions.channel) {
        return this.handleManageChannelAction(
          interaction as ChannelSelectMenuInteraction,
          field,
        );
      }
    });
  }

  private async handleManageChannelSelectType(
    interaction: StringSelectMenuInteraction,
  ) {
    await interaction.deferUpdate();

    const channelSelect =
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(SettingsCustomIds.selects.actions.channel)
          .setChannelTypes(ChannelType.GuildText)
          .setPlaceholder(
            HelperBotMessages.settings.managers.channels.select.actions.channel,
          ),
      );

    await interaction.editReply({
      components: [channelSelect],
    });
  }

  private async handleManageChannelAction(
    interaction: ChannelSelectMenuInteraction,
    field: ObjectKeys<Settings>,
  ) {
    await interaction.deferUpdate();
    const channelId = interaction.values[0];

    await SettingsModel.updateOne(
      {
        guildId: interaction.guildId,
      },
      { [field]: channelId },
    );

    await interaction.editReply(
      await this.createManageChannelsPanelMessage(interaction),
    );
  }

  private async createManageChannelsPanelMessage(
    interaction: Interaction,
  ): Promise<InteractionEditReplyOptions> {
    const settings = await this.fetchSettings(interaction.guildId);
    const embed = new EmbedBuilder()
      .setTitle(HelperBotMessages.settings.managers.channels.embed.title)
      .setFields(
        HelperBotMessages.settings.managers.channels.embed.fields(settings),
      )
      .setDefaults(interaction.user);

    const select =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(SettingsCustomIds.selects.managers.channels)
          .setOptions(
            ...HelperBotMessages.settings.managers.channels.select.options,
          )
          .setPlaceholder(
            HelperBotMessages.settings.managers.channels.select.placeholder,
          ),
      );

    return {
      embeds: [embed],
      components: [select],
    };
  }

  //=================Управление ролями=================

  private async handleManageRoles(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const repl = await interaction.editReply(
      await this.createManageRolesPanelMessage(interaction),
    );

    const collector = createSafeCollector(repl, {
      filter: (i) => i.memberPermissions.has("Administrator"),
    });

    let field: ObjectKeys<Settings> | null = null;

    collector.on("collect", (interaction) => {
      const customId = interaction.customId;

      if (customId === SettingsCustomIds.selects.managers.roles) {
        const inter = interaction as StringSelectMenuInteraction;
        field = inter.values[0] as ObjectKeys<Settings>;
        this.handleManageRolesSelectType(inter, field);
      } else if (customId === SettingsCustomIds.selects.actions.role) {
        return this.handleManageRolesAction(
          interaction as RoleSelectMenuInteraction,
          field,
        );
      }
    });
  }

  private async handleManageRolesSelectType(
    interaction: StringSelectMenuInteraction,
    field: ObjectKeys<Settings>,
  ) {
    const settings = await SettingsModel.findOne({
      guildId: interaction.guildId,
    });

    await interaction.deferUpdate();

    const roleSelect = new RoleSelectMenuBuilder()
      .setCustomId(SettingsCustomIds.selects.actions.role)
      .setPlaceholder(
        HelperBotMessages.settings.managers.roles.select.actions.role,
      );

    if (MULTIPLE_ROLE_SELECT_FIELDS.includes(field)) {
      roleSelect.setMaxValues(0).setMaxValues(25);

      const dbField = settings[field] as string[];
      if (dbField.length > 0) {
        roleSelect.setDefaultRoles(dbField.slice(0, 25));
      }
    }

    await interaction.editReply({
      components: [
        new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleSelect),
      ],
    });
  }

  private async handleManageRolesAction(
    interaction: RoleSelectMenuInteraction,
    field: ObjectKeys<Settings>,
  ) {
    await interaction.deferUpdate();

    const value =
      interaction.values.length > 1
        ? interaction.values
        : interaction.values[0];

    await SettingsModel.updateOne(
      {
        guildId: interaction.guildId,
      },
      { [field]: value },
    );

    await interaction.editReply(
      await this.createManageRolesPanelMessage(interaction),
    );
  }

  private async createManageRolesPanelMessage(
    interaction: Interaction,
  ): Promise<InteractionEditReplyOptions> {
    const settings = await SettingsModel.findOne({
      guildId: interaction.guild!.id,
    });
    const embed = new EmbedBuilder()
      .setTitle(HelperBotMessages.settings.managers.roles.embed.title)
      .setFields(
        HelperBotMessages.settings.managers.roles.embed.fields(settings),
      )
      .setDefaults(interaction.user);

    const select =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(SettingsCustomIds.selects.managers.roles)
          .setOptions(
            ...HelperBotMessages.settings.managers.roles.select.options,
          )
          .setPlaceholder(
            HelperBotMessages.settings.managers.roles.select.placeholder,
          ),
      );

    return {
      embeds: [embed],
      components: [select],
    };
  }

  private async fetchSettings(guildId: string) {
    return await SettingsModel.findOneAndUpdate(
      {
        guildId,
      },
      {},
      { upsert: true, new: true },
    );
  }
}
