import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  type ChannelSelectMenuInteraction,
  ChannelType,
  type ChatInputCommandInteraction,
  type Interaction,
  roleMention,
  RoleSelectMenuBuilder,
  type RoleSelectMenuInteraction,
} from "discord.js";
import { inject, injectable } from "tsyringe";

import { BumpReminderRepository } from "#/db/repositories/BumpReminder.js";
import { EmbedBuilder } from "#/libs/embed/embed.builder.js";
import { BumpReminderSettingsMessages } from "#/messages/helper/index.js";

import {
  BumpSettingRefresh,
  BumpSettingSetBumpBanRolesId,
  BumpSettingSetChannelId,
  BumpSettingSetPingRolesId,
  BumpSettingToggleId,
} from "./bump-settings.const.js";

@injectable()
export class BumpReminderSettingsService {
  constructor(
    @inject(BumpReminderRepository)
    private bumpReminderRepository: BumpReminderRepository
  ) {}

  async handleSettings(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const repl = await interaction.editReply(
      await this.createSettingsMessage(interaction)
    );

    const collector = repl.createMessageComponentCollector({
      filter: (i) => i.message.id === repl.id,
    });

    collector.on("collect", (interaction) => {
      const customId = interaction.customId;

      const handlers = {
        [BumpSettingSetPingRolesId]: this.handleSetPingRoles,
        [BumpSettingSetBumpBanRolesId]: this.handleSetBumpBanRole,
        [BumpSettingSetChannelId]: this.handleSetPingChannels,
        [BumpSettingToggleId]: this.handleToggleModuleState,
        [BumpSettingRefresh]: this.handleRefreshMessage,
      };

      return handlers[customId](interaction);
    });
  }

  private async handleRefreshMessage(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    interaction.editReply(await this.createSettingsMessage(interaction));
  }

  private async handleToggleModuleState(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const bumpReminder =
      await this.bumpReminderRepository.findOrCreateByGuildId(
        interaction.guildId
      );
    await bumpReminder.updateOne({
      enable: !bumpReminder.enable,
    });
    return interaction.editReply({
      content: `Успешно обновлены настройки модуля`,
    });
  }

  private async handleSetPingRoles(interaction: RoleSelectMenuInteraction) {
    await interaction.deferReply({ ephemeral: true });
    await this.bumpReminderRepository.updateByGuildId(interaction.guild.id, {
      helperRoleID: interaction.values,
    });
    return interaction.editReply({
      content: BumpReminderSettingsMessages.SetHelperRole,
    });
  }

  private async handleSetPingChannels(
    interaction: ChannelSelectMenuInteraction
  ) {
    await interaction.deferReply({ ephemeral: true });
    await this.bumpReminderRepository.updateByGuildId(interaction.guild.id, {
      pingChannelId: interaction.values[0],
    });
    return interaction.editReply({
      content: BumpReminderSettingsMessages.SetPingChannel,
    });
  }

  private async handleSetBumpBanRole(interaction: RoleSelectMenuInteraction) {
    await interaction.deferReply({ ephemeral: true });
    await this.bumpReminderRepository.updateByGuildId(interaction.guild.id, {
      bumpbanRole: interaction.values,
    });
    return interaction.editReply({
      content: BumpReminderSettingsMessages.SetBumpBanRole,
    });
  }

  private async createSettingsMessage(interaction: Interaction) {
    const bumpSettings =
      await this.bumpReminderRepository.findOrCreateByGuildId(
        interaction.guildId
      );

    const embed = new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(`Настройка модуля напоминаний о бампах`)
      .setFields(
        {
          name: `> Состояние модуля`,
          value: bumpSettings.enable ? "Включен" : "Выключен",
          inline: true,
        },
        {
          name: `> Роль хелпера`,
          value: `${!bumpSettings.helperRoleID.length ? "Нет" : bumpSettings.helperRoleID.map((r) => roleMention(r))}`,
          inline: true,
        },
        {
          name: `> Роль бамп-бана`,
          value: `${!bumpSettings.bumpbanRole.length ? "Нет" : bumpSettings.bumpbanRole.map((r) => roleMention(r))}`,
          inline: true,
        },
        {
          name: `> Канал для бампов`,
          value: `${!bumpSettings.pingChannelId.length ? "Нет" : roleMention(bumpSettings.pingChannelId)}`,
          inline: true,
        }
      );

    const pingRoles =
      new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
        new RoleSelectMenuBuilder()
          .addDefaultRoles(
            bumpSettings.helperRoleID.filter((role) =>
              interaction.guild.roles.cache.get(role)
            )
          )
          .setCustomId(BumpSettingSetPingRolesId)
          .setPlaceholder(`Выберите роль хелпера`)
      );

    const bumpbanRole =
      new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
        new RoleSelectMenuBuilder()
          .addDefaultRoles(
            bumpSettings.bumpbanRole.filter((role) =>
              interaction.guild.roles.cache.get(role)
            )
          )
          .setCustomId(BumpSettingSetBumpBanRolesId)
          .setPlaceholder(`Выберите роль бамп-бана`)
      );

    const pingChannel =
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setChannelTypes(ChannelType.GuildText)
          .setCustomId(BumpSettingSetChannelId)
          .setPlaceholder(`Выберите канал для бампов`)
      );

    const toggleModule = new ButtonBuilder()
      .setCustomId(BumpSettingToggleId)
      .setLabel(`Включить/Выключить`)
      .setStyle(ButtonStyle.Secondary);

    const refreshButton = new ButtonBuilder()
      .setCustomId(BumpSettingRefresh)
      .setLabel(`Обновить`)
      .setStyle(ButtonStyle.Secondary);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      toggleModule,
      refreshButton
    );

    return {
      embeds: [embed],
      ephemeral: true,
      components: [pingRoles, bumpbanRole, pingChannel, buttonRow],
    };
  }
}
