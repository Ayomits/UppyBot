import { Pagination } from "@discordx/pagination";
import {
  ActionRowBuilder,
  bold,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  codeBlock,
  ComponentType,
  type GuildMember,
  type Interaction,
  type Snowflake,
  time,
  TimestampStyles,
  type User,
} from "discord.js";
import { inject, injectable } from "tsyringe";

import { HelperRoles } from "#/config/index.js";
import { type HelperDocument, HelperModel } from "#/db/models/helper.model.js";
import { BumpReminderRepository } from "#/db/repositories/bump-reminder.repository.js";
import { HelperRepository } from "#/db/repositories/helper.repository.js";
import {
  throwModuleDisabledError,
  throwNotHelperError,
  throwUserNotFoundError,
} from "#/errors/index.js";
import { EmbedBuilder } from "#/libs/embed/embed.builder.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";
import { HelperInfoBumpBanButtonMessages } from "#/messages/helper/index.js";

import { MonitoringBot } from "../bump-reminder/bump-reminder.const.js";
import {
  BumpBanButtonId,
  BumpRemainingRefreshButtonId,
  type Period,
} from "./helper.const.js";

@injectable()
export class HelperService {
  constructor(
    @inject(HelperRepository) private helperRepository: HelperRepository,
    @inject(BumpReminderRepository)
    private bumpReminderRepository: BumpReminderRepository,
  ) {}

  async handleHelperInfo(user: User, interaction: ChatInputCommandInteraction) {
    const member = interaction.member as GuildMember;
    const helper = await this.helperRepository.findByUserAndGuild(
      member.id,
      interaction.guildId,
    );
    if (!member) {
      return throwUserNotFoundError(interaction);
    }

    if (!helper) {
      return throwNotHelperError(interaction);
    }

    const repl = await interaction.reply(
      await this.createHelperInfoMessage(interaction, member, helper),
    );

    const collector = repl.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 600_000,
      filter: (i) =>
        i.message.id === repl.id &&
        i.user.id === interaction.user.id &&
        i.customId === BumpBanButtonId,
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();
      await this.handleBumpBanButton(interaction, user.id);
      const helper = await this.helperRepository.findByUserAndGuild(
        member.id,
        interaction.guildId,
      );
      await interaction.editReply(
        await this.createHelperInfoMessage(interaction, member, helper),
      );
    });
  }

  async handleHelperTop(
    interaction: ChatInputCommandInteraction,
    period: Period,
  ) {
    const guildId = interaction.guildId;

    const helpers = await HelperModel.find({ guildId }).lean();
    if (!helpers.length) {
      return interaction.reply({
        content: "Нет данных о хелперах.",
        ephemeral: true,
      });
    }

    const sorted = helpers.sort(
      (a, b) => b.helperpoints[period] - a.helperpoints[period],
    );

    const chunkSize = 10;
    const pages = [];

    for (let i = 0; i < sorted.length; i += chunkSize) {
      const chunk = sorted.slice(i, i + chunkSize);
      const description = chunk
        .map((helper, index) => {
          const pos = i + index + 1;
          return `**${pos}.** <@${helper.userId}>\n**Количество баллов:** ${helper.helperpoints[period]}\n\n`;
        })
        .join("\n");

      const embed = new EmbedBuilder()
        .setDefaults(interaction.user)
        .setDescription(description)
        .setTitle(
          `Топ пользователей по количеству баллов за ${this.getPeriodText(period)}`,
        )

        .setFooter({
          text: `• Страница ${Math.floor(i / chunkSize) + 1}`,
        });

      pages.push({ embeds: [embed] });
    }

    const pagination = new Pagination(interaction, pages, {
      buttons: {
        previous: {
          emoji: "⬅️",
          label: null,
          style: ButtonStyle.Primary,
        },
        next: {
          emoji: "➡️",
          label: null,
          style: ButtonStyle.Primary,
        },

        backward: {
          emoji: "⏪",
          label: null,
          style: ButtonStyle.Secondary,
        },
        forward: {
          emoji: "⏩",
          label: null,
          style: ButtonStyle.Secondary,
        },
      },
      selectMenu: {
        labels: {
          start: "• Первая страница",
          end: "• Последняя страница",
        },
        rangePlaceholderFormat: "Страницы {start}-{end} из {total}",
        pageText: `{page} страница`,
      },
      time: 600_000,
    });
    await pagination.send();
  }

  async handleBumpRemaining(interaction: ChatInputCommandInteraction) {
    const bumpSettings =
      await this.bumpReminderRepository.findOrCreateByGuildId(
        interaction.guildId,
      );
    if (!bumpSettings.enable) return throwModuleDisabledError(interaction);
    const repl = await interaction.reply(
      await this.createRemainingMessage(interaction),
    );

    const collector = repl.createMessageComponentCollector({
      filter: (i) =>
        i.message.id === repl.id && i.customId === BumpRemainingRefreshButtonId,
      time: 600_000,
    });

    collector.on("collect", async (inter) => {
      await inter.deferUpdate();
      inter.editReply(await this.createRemainingMessage(inter));
    });
  }

  private async handleBumpBanButton(
    interaction: ButtonInteraction,
    userId: Snowflake,
  ) {
    const dbguild = await this.bumpReminderRepository.findOrCreateByGuildId(
      interaction.guildId,
    );

    const dbhelper = await this.helperRepository.findByUserAndGuild(
      userId,
      interaction.guildId,
    );

    if (!dbhelper) {
      return throwNotHelperError(interaction);
    }

    const member = (await interaction.guild.members
      .fetch(userId)
      .catch(() => null)) as GuildMember;

    if (!member) {
      return throwUserNotFoundError(interaction);
    }

    const nextBump = dbhelper.nextBump as number;
    const bumpbanRoleId = dbguild?.bumpbanRole?.[0];

    if ((nextBump > 0 && nextBump < 6) || nextBump === 6) {
      await dbhelper.updateOne({ nextBump: 0 });

      if (bumpbanRoleId) {
        await member.roles.remove(bumpbanRoleId).catch(() => null);
      }

      return await interaction.reply({
        content: HelperInfoBumpBanButtonMessages.SuccessfullRoleRemove,
        ephemeral: true,
      });
    }

    if (nextBump === 0) {
      await dbhelper.updateOne({ $inc: { nextBump: 1 } });

      if (bumpbanRoleId) {
        await member.roles.add(bumpbanRoleId).catch(() => null);
      }

      return await interaction.reply({
        content: HelperInfoBumpBanButtonMessages.SuccessfullRoleAdd,
        ephemeral: true,
      });
    }
  }

  private async createRemainingMessage(interaction: Interaction) {
    const embed = new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(`Статус мониторингов ботов`);

    const bumpSettings =
      await this.bumpReminderRepository.findOrCreateByGuildId(
        interaction.guildId,
      );

    const sdc = await interaction.guild.members
      .fetch(MonitoringBot.SdcMonitoring)
      .catch(null);
    const discordMonitoring = await interaction.guild.members
      .fetch(MonitoringBot.DiscordMonitoring)
      .catch(null);
    const serverMonitoring = await interaction.guild.members
      .fetch(MonitoringBot.ServerMonitoring)
      .catch(null);

    embed.setFields(
      {
        name: `> SDC Monitoring (/up)`,
        value: this.getMonitoringInfo(sdc, bumpSettings.sdcMonitoring?.next),
        inline: true,
      },
      {
        name: `> Server Monitoring (/bump)`,
        value: this.getMonitoringInfo(
          serverMonitoring,
          bumpSettings?.serverMonitoring?.next,
        ),
        inline: true,
      },
      {
        name: `> Discord Monitoring (/like)`,
        value: this.getMonitoringInfo(
          discordMonitoring,
          bumpSettings?.discordMonitoring?.next,
        ),
        inline: true,
      },
    );
    const refreshButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(BumpRemainingRefreshButtonId)
        .setLabel(`Обновить`)
        .setStyle(ButtonStyle.Secondary),
    );
    return { embeds: [embed], components: [refreshButton] };
  }

  private async createHelperInfoMessage(
    interaction: Interaction,
    selectedHelper: GuildMember,
    SelectedHelperIndb: HelperDocument,
  ) {
    const remaining = 6 - (SelectedHelperIndb.nextBump as number);
    const bumpBanValue =
      remaining > 0 && remaining < 6
        ? `${remaining} бампов`
        : "БампБан не активен";
    const embed = new EmbedBuilder()
      .setDefaults(selectedHelper.user)
      .setTitle(
        `${UsersUtility.getUsername(selectedHelper.user)} - ${selectedHelper.id}`,
      )
      .addFields(
        {
          name: "> Роли хелперов:",
          value: `${await this.fetchHelperRoles(selectedHelper.id, interaction)}`,
          inline: true,
        },
        {
          name: "> Состояние БампБана:",
          value: `${await this.fetchBumpBan(selectedHelper.id, interaction)}`,
          inline: true,
        },
        {
          name: "> До снятия БампБана:",
          value: `${bumpBanValue}`,
          inline: true,
        },
        {
          name: "> Баллы за неделю:",
          value: `${SelectedHelperIndb.helperpoints.weekly}`,
          inline: true,
        },
        {
          name: "> Баллы за 15 дней:",
          value: `${SelectedHelperIndb.helperpoints.twoweeks}`,
          inline: true,
        },
        {
          name: "> Баллы за всё время:",
          value: `${SelectedHelperIndb.helperpoints.alltime}`,
          inline: true,
        },
      );

    const selectedMember = await interaction.guild.members
      .fetch(selectedHelper.id)
      .catch(() => null);
    const interactionMember = interaction.member as GuildMember;

    const canManage =
      interaction.user.id !== selectedHelper.id &&
      selectedMember &&
      interactionMember.roles.highest.comparePositionTo(
        selectedMember.roles.highest,
      ) > 0;

    const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`BumpBanButton_${interaction.user.id}`)
        .setStyle(ButtonStyle.Primary)
        .setLabel("Выдать/Снять БампБан")
        .setDisabled(!canManage),
    );

    return {
      embeds: [embed],
      components: [buttonsRow],
    };
  }

  private async fetchHelperRoles(userId: string, interaction: Interaction) {
    const dbhelper = await this.helperRepository.findByUserAndGuild(
      userId,
      interaction.guildId,
    );

    if (!dbhelper) return null;

    const member = await interaction.guild.members
      .fetch(userId)
      .catch(() => null);
    if (!member) return null;

    const roles = HelperRoles.filter((roleId) =>
      member.roles.cache.has(roleId),
    ).map((roleId) => `<@&${roleId}>`);

    return roles.length > 0 ? roles.join(", ") : "Нет нужных ролей";
  }

  private async fetchBumpBan(
    userid: string,
    interaction: Interaction,
  ): Promise<string | null> {
    const dbguild = await this.bumpReminderRepository.findOrCreateByGuildId(
      interaction.guildId,
    );

    const dbhelper = await this.helperRepository.findByUserAndGuild(
      userid,
      interaction.guildId,
    );

    if (!dbhelper || !dbguild || !dbguild.enable) return null;

    const member = await interaction.guild.members
      .fetch(userid)
      .catch(() => null);
    if (!member) return null;

    const nextBump = dbhelper.nextBump as number;

    if (nextBump === 0) {
      return "Не активен";
    }

    if (nextBump === 6) {
      await dbhelper.updateOne({ nextBump: 0 });

      if (dbguild?.bumpbanRole?.length > 0) {
        await member.roles.remove(dbguild.bumpbanRole[0]).catch(() => null);
      }

      return "Не активен";
    }

    if (nextBump > 0 && nextBump < 6) {
      return `Активен`;
    }

    return "Ошибка данных о бампбане";
  }

  private getPeriodText(period: Period) {
    switch (period) {
      case "weekly":
        return "Неделю";
      case "twoweeks":
        return "15 дней";
      case "alltime":
        return "всё время";
    }
  }

  private getMonitoringInfo(
    member: GuildMember | null,
    timestamp: Date | null,
  ) {
    if (!member) return bold("Мониторинг не подключен");
    if (!timestamp) return bold("Не использована ни одна команда мониторинга");
    const now = Date.now();
    const timeMs = timestamp.getTime();
    if (now >= timeMs) return codeBlock("Пора использовать команду!");
    return time(timestamp, TimestampStyles.RelativeTime);
  }
}
