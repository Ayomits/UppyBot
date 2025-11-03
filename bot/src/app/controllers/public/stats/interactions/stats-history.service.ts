import { Pagination, PaginationResolver } from "@discordx/pagination";
import type { mongoose } from "@typegoose/typegoose";
import type { ChatInputCommandInteraction, User } from "discord.js";
import {
  bold,
  chatInputApplicationCommandMention,
  MessageFlags,
  time,
  TimestampStyles,
  userMention,
} from "discord.js";
import { injectable } from "tsyringe";

import { EmbedBuilder } from "#/libs/embed/embed.builder.js";
import type { BumpLogDocument } from "#/db/models/bump-log.model.js";
import { BumpLogModel } from "#/db/models/bump-log.model.js";

import {
  getCommandIdByRemindType,
  getCommandNameByRemindType,
} from "../../reminder/reminder.const.js";
import { UppyPaginationLimit } from "../stats.const.js";
import { BaseUppyService } from "../stats.service.js";

@injectable()
export class UppyStatsService extends BaseUppyService {
  public async handleStatsCommand(
    interaction: ChatInputCommandInteraction,
    user: User,
  ) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const filter: mongoose.FilterQuery<BumpLogDocument> = {
      guildId: interaction.guildId,
    };

    if (user) {
      filter.executorId = user.id;
    }

    const count = await BumpLogModel.countDocuments(filter);

    const maxPages = this.calculateMaxPages(count);

    const resolver = new PaginationResolver(async (page) => {
      const data = await this.fetchStatsPage(page, filter);
      return {
        embeds: [
          this.buildStatsCommandPaginationEmbed(
            page,
            maxPages,
            data,
            interaction.user,
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

  private async fetchStatsPage(
    page: number,
    filter: mongoose.FilterQuery<BumpLogDocument>,
  ) {
    return await BumpLogModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(page * UppyPaginationLimit)
      .limit(UppyPaginationLimit);
  }

  private buildStatsCommandPaginationEmbed(
    page: number,
    maxPages: number,
    data: Awaited<ReturnType<typeof this.fetchStatsPage>>,
    user: User,
  ) {
    const embed = new EmbedBuilder().setDefaults(user);

    const description =
      data.length === 0
        ? "Нет данных для отображения"
        : data
            .map(({ executorId, createdAt, type, points }, index) => {
              const position = page * UppyPaginationLimit + index + 1;
              const command = chatInputApplicationCommandMention(
                getCommandNameByRemindType(type)!,
                getCommandIdByRemindType(type)!,
              );
              return [
                `${bold(position.toString())} ${userMention(executorId)}`,
                `• ${bold("Команда:")} ${command}`,
                `• ${bold("Поинты:")} ${points}`,
                `• ${bold("Дата выполнения:")} ${time(Math.floor((createdAt ?? new Date()).getTime() / 1_000), TimestampStyles.LongDateTime)}`,
                "",
              ].join("\n");
            })
            .join("\n");

    return embed
      .setTitle(`История выполнения команд`)
      .setDescription(description)
      .setFooter({
        text: `Страница ${page + 1}/${maxPages}`,
      });
  }
}
