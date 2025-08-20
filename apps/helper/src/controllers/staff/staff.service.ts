import { Pagination, PaginationResolver } from "@discordx/pagination";
import { createSafeCollector } from "@fear/utils";
import {
  ActionRowBuilder,
  type AutocompleteInteraction,
  bold,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type Guild,
  type GuildMember,
  type Interaction,
  type InteractionEditReplyOptions,
  type User,
  type UserContextMenuCommandInteraction,
  userMention,
} from "discord.js";
import { DateTime } from "luxon";
import { injectable } from "tsyringe";

import { EmptyStaffRoleError, UserNotFoundError } from "#/errors/errors.js";
import { EmbedBuilder } from "#/libs/embed/embed.builder.js";
import { HelperBotMessages } from "#/messages/index.js";
import { BumpModel } from "#/models/bump.model.js";
import {
  type RemindDocument,
  RemindModel,
  type StaffInfoAgregation,
} from "#/models/remind.model.js";
import { SettingsModel } from "#/models/settings.model.js";

import {
  DefaultTimezone,
  getCommandByRemindType,
  MonitoringBot,
  RemindType,
} from "../reminder/reminder.const.js";
import { StaffCustomIds } from "./staff.const.js";
import { Pagination, PaginationResolver } from "@discordx/pagination";

const startDateValue = { hour: 0, minute: 0, second: 0, millisecond: 0 };
const endDateValue = { hour: 23, minute: 59, second: 59, millisecond: 59 };

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
    await interaction.deferReply({ ephemeral: true });
    user = typeof user === "undefined" ? interaction.user : user;

    const { fromDate, toDate } = this.parseOptionsDateString(from, to);

    const entries = await BumpModel.aggregate<StaffInfoAgregation>([
      {
        $match: {
          guildId: interaction.guildId,
          executorId: user.id,
          createdAt: {
            $gte: fromDate,
            $lte: toDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          points: { $sum: "$points" },
          up: {
            $sum: {
              $cond: {
                if: { $eq: ["$type", RemindType.SdcMonitoring] },
                then: 1,
                else: 0,
              },
            },
          },
          like: {
            $sum: {
              $cond: {
                if: { $eq: ["$type", RemindType.DiscordMonitoring] },
                then: 1,
                else: 0,
              },
            },
          },
          bump: {
            $sum: {
              $cond: {
                if: { $eq: ["$type", RemindType.ServerMonitoring] },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },
    ]);

    const embed = new EmbedBuilder()
      .setTitle(HelperBotMessages.staff.info.embed.title)
      .setFields(HelperBotMessages.staff.info.embed.fields(entries[0]))
      .setDefaults(user);

    return interaction.editReply({ embeds: [embed] });
  }

  public async handleStaffTop(
    interaction: ChatInputCommandInteraction,
    from?: string,
    to?: string,
  ) {
    await interaction.deferReply({ ephemeral: true });
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

    if (settings.bumpRoleIds.length === 0) {
      return EmptyStaffRoleError.throw(interaction);
    }

    const hasStaffRolesIds = interaction.guild.members.cache
      .filter((m) =>
        m.roles.cache.some((r) => settings.bumpRoleIds.includes(r.id)),
      )
      .map((m) => m.id);

    const { fromDate, toDate } = this.parseOptionsDateString(from, to);

    const count = await BumpModel.aggregate<{ totalCount: number }>([
      {
        $match: {
          guildId: interaction.guildId,
          executorId: { $in: hasStaffRolesIds },
          createdAt: {
            $gte: fromDate,
            $lte: toDate,
          },
        },
      },
      {
        $group: {
          _id: "$executorId",
        },
      },
      { $count: "totalCount" },
    ]);

    const limit = 10;
    const totalCount = count[0]?.totalCount || 0;
    const maxPages = Math.max(1, Math.ceil(totalCount / limit));

    async function fetchPage(page: number) {
      const skip = page * limit;

      return await BumpModel.aggregate<
        Pick<StaffInfoAgregation, "points" | "up" | "like" | "bump"> & {
          _id: string;
          executorId: string;
        }
      >([
        {
          $match: {
            guildId: interaction.guildId,
            executorId: { $in: hasStaffRolesIds },
            createdAt: {
              $gte: fromDate,
              $lte: toDate,
            },
          },
        },
        {
          $group: {
            _id: "$executorId",
            executorId: { $first: "$executorId" },
            points: { $sum: "$points" },
            up: {
              $sum: {
                $cond: {
                  if: { $eq: ["$type", RemindType.SdcMonitoring] },
                  then: 1,
                  else: 0,
                },
              },
            },
            like: {
              $sum: {
                $cond: {
                  if: { $eq: ["$type", RemindType.DiscordMonitoring] },
                  then: 1,
                  else: 0,
                },
              },
            },
            bump: {
              $sum: {
                $cond: {
                  if: { $eq: ["$type", RemindType.ServerMonitoring] },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $sort: { points: -1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);
    }

    function createEmbed(
      data: Awaited<ReturnType<typeof fetchPage>>,
      page: number,
    ) {
      const embed = new EmbedBuilder().setDefaults(interaction.user);

      const description =
        data.length === 0
          ? "Нет данных для отображения"
          : data
              .map(({ executorId, points, up, like, bump }, index) => {
                const position = page * limit + index + 1;
                return [
                  `${bold(position.toString())} ${userMention(executorId)}`,
                  `• Поинты: ${points}`,
                  `• Up: ${up} | Like: ${like} | Bump: ${bump}`,
                  "",
                ].join("\n");
              })
              .join("\n");

      return embed
        .setTitle("Топ сотрудников")
        .setDescription(description)
        .setFooter({
          text: `Страница ${page + 1}/${maxPages} | Всего сотрудников: ${totalCount}`,
        });
    }

    const resolver = new PaginationResolver(async (page) => {
      const data = await fetchPage(page);

      return { embeds: [createEmbed(data, page)] };
    }, maxPages);
    const pagination = new Pagination(interaction, resolver, {
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
      selectMenu: {
        disabled: true,
      },
    });

    return pagination.send();
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

  public static async handleInfoAutocomplete(
    interaction: AutocompleteInteraction,
  ) {
    const value = interaction.options.getFocused();
    const { inputDate, startDate, endDate } = this.parseDateString(value);

    let createdAtFilter = {};

    if (value) {
      if (!inputDate) {
        return interaction.respond([]);
      } else {
        createdAtFilter = { $lte: endDate, $gte: startDate };
      }
    }

    const entries = await BumpModel.aggregate([
      {
        $match: {
          guildId: interaction.guildId,
          createdAt: {
            $exists: true,
            $ne: null,
            ...createdAtFilter,
          },
        },
      },
      {
        $sort: { createdAt: 1 },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%d.%m.%Y",
              date: "$createdAt",
              timezone: "Europe/Moscow",
            },
          },
          createdAt: { $first: "$createdAt" },
          document: { $first: "$$ROOT" },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $limit: 25,
      },
    ]);

    await interaction.respond(
      entries.map((entry) => ({
        name: DateTime.fromJSDate(entry.createdAt)
          .setZone(DefaultTimezone)
          .toFormat("dd.MM.y"),
        value: entry.createdAt,
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

  // ======Команда Remaining======
  async handleRemainingCommand(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const repl = await interaction.editReply(
      await this.buildReminderStatusMessage(interaction),
    );

    const collector = createSafeCollector(repl);

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
    const [discordMonitoring, sdcMonitoring, serverMonitoring] =
      await Promise.all([
        this.fetchMonitoringBot(
          interaction.guild!,
          MonitoringBot.DiscordMonitoring,
        ),
        this.fetchMonitoringBot(
          interaction.guild!,
          MonitoringBot.SdcMonitoring,
        ),
        this.fetchMonitoringBot(
          interaction.guild!,
          MonitoringBot.ServerMonitoring,
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

    const monitorings = await RemindModel.find({
      type: { $in: types },
      guildId: interaction.guildId,
    })
      .sort({ timestamp: -1 })
      .limit(types.length);

    const monitoringsMap = Object.fromEntries(
      monitorings.map((m) => [
        getCommandByRemindType(m.type as RemindType),
        m as RemindDocument,
      ]),
    );

    const updateButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(HelperBotMessages.staff.status.buttons.update)
        .setCustomId(StaffCustomIds.remaining.buttons.updaters.updateRemaining)
        .setStyle(ButtonStyle.Secondary),
    );

    const embed = new EmbedBuilder()
      .setDefaults(interaction.user)
      .setTitle(HelperBotMessages.staff.status.embed.title)
      .setFields(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        HelperBotMessages.staff.status.embed.fields(monitoringsMap as any),
      );

    return {
      embeds: [embed],
      components: [updateButton],
    };
  }

  private async fetchMonitoringBot(
    guild: Guild,
    id: MonitoringBot,
  ): Promise<GuildMember | null> {
    return await guild.members.fetch(id).catch(() => null);
  }
}
