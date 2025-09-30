import { Pagination, PaginationResolver } from "@discordx/pagination";
import type { mongoose } from "@typegoose/typegoose";
import {
  ActionRowBuilder,
  type AutocompleteInteraction,
  bold,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  chatInputApplicationCommandMention,
  type ChatInputCommandInteraction,
  ContainerBuilder,
  type Guild,
  type GuildMember,
  heading,
  HeadingLevel,
  type Interaction,
  type InteractionEditReplyOptions,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  time,
  TimestampStyles,
  type User,
  type UserContextMenuCommandInteraction,
  userMention,
} from "discord.js";
import { DateTime } from "luxon";
import { injectable } from "tsyringe";

import { EmptyStaffRoleError, UserNotFoundError } from "#/errors/errors.js";
import { EmbedBuilder } from "#/libs/embed/embed.builder.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";
import { createSafeCollector } from "#/libs/utils/collector.js";
import { BumpBanModel } from "#/models/bump-ban.model.js";
import type { BumpGuildCalendarDocument } from "#/models/bump-guild-calendar.model.js";
import { BumpGuildCalendarModel } from "#/models/bump-guild-calendar.model.js";
import type { BumpLogDocument } from "#/models/bump-log.model.js";
import { BumpLogModel } from "#/models/bump-log.model.js";
import type { BumpUser, BumpUserDocument } from "#/models/bump-user.model.js";
import { BumpUserModel } from "#/models/bump-user.model.js";
import { BumpUserCalendarModel } from "#/models/bump-user-calendar.model.js";
import { type RemindDocument, RemindModel } from "#/models/remind.model.js";
import { SettingsModel } from "#/models/settings.model.js";

import { UppyInfoMessage } from "../../messages/core-info.message.js";
import { UppyRemainingMessage } from "../../messages/uppy-remaining.message.js";
import {
  BumpBanLimit,
  DefaultTimezone,
  getCommandIdByRemindType,
  getCommandNameByRemindType,
  MonitoringBot,
  RemindType,
} from "../reminder/reminder.const.js";
import { endDateValue, StaffCustomIds, startDateValue } from "./staff.const.js";

const limit = 10;

@injectable()
export class StaffService {
  async handleInfoCommand(
    interaction:
      | ChatInputCommandInteraction
      | UserContextMenuCommandInteraction,
    user?: User,
    from?: string,
    to?: string,
  ) {
    await interaction.deferReply();
    user = typeof user === "undefined" ? interaction.user : user;

    const { fromDate, toDate } = this.parseOptionsDateString(from, to);

    const [entry, bumpBan, settings] = await Promise.all([
      BumpUserModel.aggregate<Partial<BumpUserDocument>>([
        {
          $match: {
            guildId: interaction.guildId,
            userId: user.id,
            timestamp: {
              $gte: fromDate,
              $lte: toDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            disboardMonitoring: { $sum: "$disboardMonitoring" },
            dsMonitoring: { $sum: "$dsMonitoring" },
            sdcMonitoring: { $sum: "$sdcMonitoring" },
            serverMonitoring: { $sum: "$serverMonitoring" },
            points: { $sum: "$points" },
            userId: { $first: "$userId" },
          },
        },
        { $limit: 1 },
      ]),
      BumpBanModel.findOne({
        guildId: interaction.guildId,
        userId: interaction.user.id,
      }),
      SettingsModel.findOne({ guildId: interaction.guildId }),
    ]);

    const [authorMember, targetMember] = await Promise.all([
      interaction.guild.members.fetch(interaction.user.id),
      interaction.guild.members.fetch(user.id),
    ]);

    const canManage = authorMember.roles.cache.some(
      (r) => settings?.managerRoles && settings?.managerRoles.includes(r.id),
    );
    const canRemove =
      bumpBan && (bumpBan?.removeIn ?? 0) < BumpBanLimit && canManage;

    const removeBumpBan = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(UppyInfoMessage.buttons.actions.removeBumpBan.label)
        .setCustomId(StaffCustomIds.info.buttons.actions.removeBumpBan)
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!canRemove),
    );

    const container = new ContainerBuilder()
      .addSectionComponents(
        new SectionBuilder()
          .setThumbnailAccessory(
            new ThumbnailBuilder().setURL(UsersUtility.getAvatar(user)),
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                heading(
                  UppyInfoMessage.embed.title(UsersUtility.getUsername(user)),
                  HeadingLevel.Two,
                ),
                UppyInfoMessage.embed.fields(entry[0], bumpBan),
              ].join("\n"),
            ),
          ),
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents(removeBumpBan);

    const repl = await interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    const collector = createSafeCollector(repl, {
      filter: (i) => i.user.id === interaction.user.id,
    });

    collector.on("collect", (interaction) => {
      const customId = interaction.customId;

      const handlers = {
        [StaffCustomIds.info.buttons.actions.removeBumpBan]:
          this.handleBumpBanRemoval.bind(this),
      };

      return handlers[customId](interaction, targetMember);
    });
  }

  private async handleBumpBanRemoval(
    interaction: ButtonInteraction,
    member: GuildMember,
  ) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const [settings, bumpBan] = await Promise.all([
      SettingsModel.findOne({ guildId: interaction.guildId }),
      BumpBanModel.findOne({ guildId: interaction.guildId, userId: member.id }),
    ]);

    if (!bumpBan) {
      return interaction.editReply({
        content: UppyInfoMessage.errors.noBumpBan,
      });
    }

    const authorMember = interaction.member as GuildMember;

    if (!settings?.bumpBanRoleId) {
      return interaction.editReply({
        content: UppyInfoMessage.errors.notSetUpped,
      });
    }

    if (
      !authorMember.roles.cache.some(
        (r) => settings?.managerRoles && settings?.managerRoles.includes(r.id),
      )
    ) {
      return interaction.editReply({
        content: UppyInfoMessage.errors.forbidden,
      });
    }

    await Promise.allSettled([
      member.roles.remove(settings?.bumpBanRoleId),
      BumpBanModel.deleteOne({
        guildId: interaction.guildId,
        userId: member.id,
      }),
    ]);

    return interaction.editReply({
      content: UppyInfoMessage.buttons.actions.removeBumpBan.success,
    });
  }

  // ======Команда uppy stats=====

  public async handleStatsCommand(
    interaction: ChatInputCommandInteraction,
    user: User,
    field: number,
  ) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    user = typeof user !== "undefined" ? user : interaction.user;
    const filter: mongoose.FilterQuery<BumpLogDocument> = {
      guildId: interaction.guildId,
      executorId: user.id,
    };

    if (typeof field !== "undefined") {
      filter.type = field;
    }

    const count = await BumpLogModel.countDocuments(filter);

    const maxPages = this.calculateMaxPages(count);

    function createEmbed(
      data: Awaited<ReturnType<typeof fetchMore>>,
      page: number,
    ) {
      const embed = new EmbedBuilder().setDefaults(interaction.user);

      const description =
        data.length === 0
          ? "Нет данных для отображения"
          : data
              .map(({ executorId, createdAt, type, points }, index) => {
                const position = page * limit + index + 1;
                const command = chatInputApplicationCommandMention(
                  getCommandNameByRemindType(type),
                  getCommandIdByRemindType(type),
                );
                return [
                  `${bold(position.toString())} ${userMention(executorId)}`,
                  `• ${bold("Команда:")} ${command}`,
                  `• ${bold("Поинты:")} ${points}`,
                  `• ${bold("Дата выполнения:")} ${time(Math.floor(createdAt.getTime() / 1_000), TimestampStyles.LongDateTime)}`,
                  "",
                ].join("\n");
              })
              .join("\n");

      return embed
        .setTitle(`История выполнения команд`)
        .setDescription(description)
        .setFooter({
          text: `Страница ${page + 1}/${maxPages} | Всего команд: ${count}`,
        });
    }

    async function fetchMore(page: number) {
      return BumpLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(page * limit)
        .limit(limit);
    }

    const resolver = new PaginationResolver(async (page) => {
      const data = await fetchMore(page);
      return { embeds: [createEmbed(data, page)] };
    }, maxPages);

    const pagination = new Pagination(interaction, resolver, {
      selectMenu: {
        labels: {
          start: "Первая страница",
          end: "Последняя страница",
        },
        rangePlaceholderFormat: `Выберите страницу`,
        pageText: "Страница {page}",
      },
      buttons: {
        forward: {
          enabled: false,
        },
        backward: {
          enabled: false,
        },
        next: {
          label: "",
        },
        previous: {
          label: "",
        },
      },
    });

    return pagination.send();
  }

  // ======Команда uppy top======
  public async handleTopCommand(
    interaction: ChatInputCommandInteraction,
    from?: string,
    to?: string,
  ) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const settings = await SettingsModel.findOneAndUpdate(
      { guildId: interaction.guildId },
      {},
      { upsert: true },
    );

    const member = (await interaction.guild.members
      .fetch()
      .catch(() => null)) as GuildMember;

    if (!member) {
      return UserNotFoundError.throw(interaction);
    }

    if (!settings?.bumpRoleIds || settings?.bumpRoleIds?.length === 0) {
      return EmptyStaffRoleError.throw(interaction);
    }

    const hasStaffRolesIds = interaction.guild.members.cache
      .filter((m) =>
        m.roles.cache.some((r) => settings?.bumpRoleIds.includes(r.id)),
      )
      .map((m) => m.id);

    const { fromDate, toDate } = this.parseOptionsDateString(from, to);

    const initial = await fetchPage(0);

    const totalCount = initial?.meta?.count ?? 0;
    const maxPages = this.calculateMaxPages(totalCount);

    async function fetchPage(page: number) {
      const skip = page * limit;

      const filter: mongoose.FilterQuery<BumpUser> = {
        guildId: interaction.guild.id,
        userId: { $in: hasStaffRolesIds },
        timestamp: {
          $lte: toDate,
          $gte: fromDate,
        },
      };

      const [data] = await BumpUserModel.aggregate<{
        users: Partial<BumpUserDocument>[];
        meta: { count: number };
      }>([
        {
          $match: filter,
        },
        {
          $facet: {
            users: [
              {
                $group: {
                  _id: null,
                  disboardMonitoring: { $sum: "$disboardMonitoring" },
                  dsMonitoring: { $sum: "$dsMonitoring" },
                  sdcMonitoring: { $sum: "$sdcMonitoring" },
                  serverMonitoring: { $sum: "$serverMonitoring" },
                  points: { $sum: "$points" },
                  userId: { $first: "$userId" },
                },
              },
            ],
            meta: [{ $group: { _id: null, count: { $sum: 1 } } }],
          },
        },
      ])
        .limit(limit)
        .skip(skip);

      return {
        users: data?.users ?? [],
        meta: data?.meta[0],
      };
    }

    function createEmbed(
      payload: Awaited<ReturnType<typeof fetchPage>>,
      page: number,
    ) {
      const embed = new EmbedBuilder().setDefaults(interaction.user);
      const description =
        payload.users.length === 0
          ? "Нет данных для отображения"
          : payload.users
              .map(
                (
                  {
                    points,
                    dsMonitoring,
                    sdcMonitoring,
                    serverMonitoring,
                    userId,
                  },
                  index,
                ) => {
                  const position = page * limit + index + 1;
                  return [
                    `${bold(position.toString())} ${userMention(userId)}`,
                    `• Поинты: ${points}`,
                    `• Up: ${sdcMonitoring} | Like: ${dsMonitoring} | Bump: ${serverMonitoring}`,
                    "",
                  ].join("\n");
                },
              )
              .join("\n");

      return embed
        .setTitle("Топ сотрудников")
        .setDescription(description)
        .setFooter({
          text: `Страница ${page + 1}/${maxPages} | Всего сотрудников: ${totalCount}`,
        });
    }

    const resolver = new PaginationResolver(async (page) => {
      const data = page === 0 ? initial : await fetchPage(page);

      return { embeds: [createEmbed(data, page)] };
    }, maxPages);

    const pagination = new Pagination(interaction, resolver, {
      selectMenu: {
        labels: {
          start: "Первая страница",
          end: "Последняя страница",
        },
        rangePlaceholderFormat: `Выберите страницу`,
        pageText: "Страница {page}",
      },
      buttons: {
        forward: {
          enabled: false,
        },
        backward: {
          enabled: false,
        },
        next: {
          label: "",
        },
        previous: {
          label: "",
        },
      },
    });

    return pagination.send();
  }

  private calculateMaxPages(count: number, limit = 10) {
    return Math.max(1, Math.ceil(count / limit));
  }

  // ===============AUTOCOMPLETE============

  public static async handleInfoAutocomplete(
    interaction: AutocompleteInteraction,
  ) {
    const value = interaction.options.getFocused();
    const user = interaction.options.get("user")?.value ?? interaction.user.id;
    const { inputDate, startDate, endDate } = this.parseDateString(value);

    let createdAtFilter = {};

    if (value) {
      if (!inputDate) {
        return interaction.respond([]);
      } else {
        createdAtFilter = { $lte: endDate, $gte: startDate };
      }
    }

    const entries = await BumpUserCalendarModel.find({
      guildId: interaction.guildId,
      userId: user,
      createdAt: createdAtFilter,
    });

    await interaction.respond(
      entries.map((entry) => ({
        name: entry.formatted,
        value: entry.timestamp.toString(),
      })),
    );
  }

  public static async handleTopAutocomplete(
    interaction: AutocompleteInteraction,
  ) {
    const value = interaction.options.getFocused();
    const { inputDate, startDate, endDate } = this.parseDateString(value);

    const createdAtFilter: mongoose.FilterQuery<BumpGuildCalendarDocument> = {
      guildId: interaction.guildId,
    };

    if (value) {
      if (!inputDate) {
        return interaction.respond([]);
      } else {
        createdAtFilter.timestamp = { $lte: endDate, $gte: startDate };
      }
    }

    const entries = await BumpGuildCalendarModel.find(createdAtFilter)
      .sort({ timestamp: -1 })
      .limit(25);

    await interaction.respond(
      entries.map((entry) => ({
        name: entry.formatted,
        value: entry.timestamp.toString(),
      })),
    );
  }

  private static parseDateString(date: string) {
    const formats = ["dd", "dd.MM.yy", "dd.MM"];
    const validFormat = formats
      .map((f) => DateTime.fromFormat(date, f))
      .filter((f) => f.isValid);

    let inputDate: DateTime = DateTime.now().set(startDateValue);

    if (validFormat.length > 0) {
      inputDate = validFormat[0].set(startDateValue);
    }

    const startDate = inputDate.set(startDateValue);
    const endDate = inputDate.set(endDateValue);

    return {
      inputDate: inputDate.isValid ? inputDate : null,
      startDate: inputDate.isValid ? startDate : null,
      endDate: inputDate.isValid ? endDate : null,
    };
  }

  private parseOptionsDateString(from?: string, to?: string) {
    const parsedFromDate =
      !from && !to
        ? DateTime.now()
            .setZone(DefaultTimezone)
            .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        : DateTime.fromJSDate(new Date(from ?? to)).setZone(DefaultTimezone);
    const parsedToDate =
      !from && !to
        ? parsedFromDate
        : DateTime.fromJSDate(new Date(to ?? from)).setZone(DefaultTimezone);

    let toDate: DateTime = parsedToDate.set(endDateValue);
    let fromDate: DateTime = parsedFromDate.set(startDateValue);

    if (parsedToDate <= parsedFromDate) {
      toDate = parsedFromDate.set(endDateValue);
      fromDate = parsedToDate.set(startDateValue);
    }

    return {
      toDate,
      fromDate,
    };
  }

  // ======Команда Remaining======
  async handleRemainingCommand(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const repl = await interaction.editReply(
      await this.buildReminderStatusMessage(interaction),
    );

    const collector = createSafeCollector(repl, {
      filter: (i) => i.user.id === interaction.user.id,
    });

    collector.on("collect", (interaction) => {
      const customId = interaction.customId;

      const handlers = {
        [StaffCustomIds.remaining.buttons.updaters.updateRemaining]:
          this.handleUpdateReminderStatus.bind(this),
      };

      return handlers[customId]?.(interaction);
    });
  }

  private async handleUpdateReminderStatus(interaction: ButtonInteraction) {
    await interaction.deferUpdate();
    await interaction.editReply(
      await this.buildReminderStatusMessage(interaction),
    );
  }

  private async buildReminderStatusMessage(
    interaction: Interaction,
  ): Promise<InteractionEditReplyOptions> {
    const [
      discordMonitoring,
      sdcMonitoring,
      serverMonitoring,
      disboardMonitoring,
    ] = await Promise.all([
      this.fetchMonitoringBot(
        interaction.guild!,
        MonitoringBot.DiscordMonitoring,
      ),
      this.fetchMonitoringBot(interaction.guild!, MonitoringBot.SdcMonitoring),
      this.fetchMonitoringBot(
        interaction.guild!,
        MonitoringBot.ServerMonitoring,
      ),
      this.fetchMonitoringBot(
        interaction.guild!,
        MonitoringBot.DisboardMonitoring,
      ),
    ]);

    const types: RemindType[] = [];

    if (discordMonitoring) {
      types.push(RemindType.DiscordMonitoring);
    }

    if (sdcMonitoring) {
      types.push(RemindType.SdcMonitoring);
    }

    if (serverMonitoring) {
      types.push(RemindType.ServerMonitoring);
    }

    if (disboardMonitoring) {
      types.push(RemindType.DisboardMonitoring);
    }

    const monitorings = await RemindModel.find({
      type: { $in: types },
      guildId: interaction.guildId,
    })
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(types.length);

    const monitoringsMap = Object.fromEntries(
      monitorings.map((m) => [m.type, m as RemindDocument]),
    );

    const updateButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(UppyRemainingMessage.buttons.update)
        .setCustomId(StaffCustomIds.remaining.buttons.updaters.updateRemaining)
        .setStyle(ButtonStyle.Secondary),
    );

    const container = new ContainerBuilder()
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              [
                heading(UppyRemainingMessage.embed.title, HeadingLevel.Two),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                UppyRemainingMessage.embed.fields(monitoringsMap as any),
              ].join("\n"),
            ),
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder().setURL(
              UsersUtility.getAvatar(interaction.user),
            ),
          ),
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents(updateButton);

    return {
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    };
  }

  private async fetchMonitoringBot(
    guild: Guild,
    id: MonitoringBot,
  ): Promise<GuildMember | null> {
    return await guild.members
      .fetch({ user: id, cache: true })
      .catch(() => null);
  }
}
