import { Pagination, PaginationResolver } from "@discordx/pagination";
import type { mongoose } from "@typegoose/typegoose";
import type { ChatInputCommandInteraction, User } from "discord.js";
import { bold, MessageFlags, userMention } from "discord.js";
import { inject, injectable } from "tsyringe";

import type { BumpUser } from "#/shared/db/models/uppy-discord/bump-user.model.js";
import { BumpUserModel } from "#/shared/db/models/uppy-discord/bump-user.model.js";
import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { EmbedBuilder } from "#/shared/libs/embed/embed.builder.js";

import { PaginationLimit } from "../stats.const.js";
import { BaseUppyService } from "../stats.service.js";

@injectable()
export class LeaderboardService extends BaseUppyService {
  constructor(
    @inject(SettingsRepository) private settingsRepository: SettingsRepository
  ) {
    super();
  }

  public async handleTopCommand(
    interaction: ChatInputCommandInteraction,
    from?: string,
    to?: string
  ) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const settings = await this.settingsRepository.findGuildSettings(
      interaction.guildId!
    );

    if (
      !settings?.roles.staffRoles ||
      settings?.roles.staffRoles?.length === 0
    ) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDefaults(interaction.user)
            .setTitle("Ошибка")
            .setDescription(`На сервере не настроены роли сотрудников`),
        ],
      });
    }

    const hasStaffRolesIds = interaction.guild?.members.cache
      .filter((m) =>
        m.roles.cache.some((r) => settings?.roles.staffRoles?.includes(r.id))
      )
      .map((m) => m.id);

    const { fromDate, toDate } = this.parseOptionsDateString(from, to);

    const filter = {
      guildId: interaction.guild!.id,
      userId: { $in: hasStaffRolesIds },
      timestamp: {
        $lte: toDate,
        $gte: fromDate,
      },
    };

    const initial = await this.fetchLeaderboardPage(0, filter);

    const totalCount = initial?.meta?.count ?? 0;
    const maxPages = this.calculateMaxPages(totalCount);

    const resolver = new PaginationResolver(async (page) => {
      const data =
        page === 0 ? initial : await this.fetchLeaderboardPage(page, filter);

      return {
        embeds: [
          this.buildTopCommandPaginationEmbed(
            page,
            maxPages,
            data,
            interaction.user
          ),
        ],
      };
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

  private async fetchLeaderboardPage(
    page: number,
    filter: mongoose.FilterQuery<BumpUser>
  ) {
    const skip = page * PaginationLimit;
    const [data] = await BumpUserModel.model.aggregate([
      {
        $match: filter,
      },
      {
        $facet: {
          users: [
            {
              $group: {
                _id: "$userId",
                disboardMonitoring: { $sum: "$disboardMonitoring" },
                dsMonitoring: { $sum: "$dsMonitoring" },
                sdcMonitoring: { $sum: "$sdcMonitoring" },
                serverMonitoring: { $sum: "$serverMonitoring" },
                points: { $sum: "$points" },
              },
            },
            { $sort: { points: -1 } },
            { $skip: skip },
            { $limit: PaginationLimit },
          ],
          totalCount: [
            {
              $group: {
                _id: "$userId",
              },
            },
            {
              $count: "count",
            },
          ],
        },
      },
      {
        $project: {
          users: 1,
          meta: [
            {
              count: {
                $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
              },
            },
          ],
        },
      },
    ]);

    return {
      users: data?.users ?? [],
      meta: data?.meta[0],
    };
  }

  private buildTopCommandPaginationEmbed(
    page: number,
    maxPages: number,
    payload: Awaited<ReturnType<typeof this.fetchLeaderboardPage>>,
    user: User
  ) {
    const embed = new EmbedBuilder().setDefaults(user);
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
                  _id: userId,
                },
                index
              ) => {
                const position = page * PaginationLimit + index + 1;
                return [
                  `${bold(position.toString())} ${userMention(userId as unknown as string)}`,
                  `• Поинты: ${points}`,
                  `• Up: ${sdcMonitoring} | Like: ${dsMonitoring} | Bump: ${serverMonitoring}`,
                  "",
                ].join("\n");
              }
            )
            .join("\n");

    return embed
      .setTitle("Топ сотрудников")
      .setDescription(description)
      .setFooter({
        text: `Страница ${page + 1}/${maxPages} | Всего сотрудников: ${payload.meta.count}`,
      });
  }
}
