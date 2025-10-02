import {
  type ChatInputCommandInteraction,
  ContainerBuilder,
  heading,
  HeadingLevel,
  MessageFlags,
  unorderedList,
  userMention,
} from "discord.js";
import { injectable } from "tsyringe";

import { staff } from "#/const/owners.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";
import { BumpLogModel } from "#/models/bump-log.model.js";
import { RemindLogsModel, RemindLogState } from "#/models/remind-logs.model.js";

import { UppyBotInviteService } from "./bot-invite.service.js";

@injectable()
export class UppyBotStatsService extends UppyBotInviteService {
  async handleStats(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const [remindCount, bumpsCount] = await Promise.all([
      RemindLogsModel.countDocuments({ state: RemindLogState.Sended }),
      BumpLogModel.countDocuments(),
    ]);

    const container = new ContainerBuilder()
      .addSectionComponents((builder) =>
        builder
          .setThumbnailAccessory((builder) =>
            builder.setURL(UsersUtility.getAvatar(interaction.user)),
          )
          .addTextDisplayComponents((builder) =>
            builder.setContent(
              [
                heading("Информация о боте"),
                "",
                unorderedList([
                  `Количество серверов: ${interaction.client.application.approximateGuildCount}`,
                  `Количество высланных напоминаний: ${remindCount}`,
                  `Количество обработанных команд: ${bumpsCount}`,
                ]),
              ].join("\n"),
            ),
          ),
      )
      .addSeparatorComponents((builder) => builder.setDivider(true))
      .addSectionComponents((builder) =>
        builder
          .setThumbnailAccessory((builder) =>
            builder.setURL(UsersUtility.getAvatar(interaction.client.user)),
          )
          .addTextDisplayComponents((builder) =>
            builder.setContent(
              [
                heading("Информация о владельцах", HeadingLevel.Two),
                "",
                unorderedList([
                  `Владелец: ${staff.owners.map((o) => userMention(o)).join("")}`,
                  `Совладельцы: ${staff.coOwners.map((co) => userMention(co)).join("")}`,
                ]),
              ].join("\n"),
            ),
          ),
      )
      .addSeparatorComponents((builder) => builder.setDivider(true))
      .addTextDisplayComponents((builder) =>
        builder.setContent(heading("Полезные ссылки", HeadingLevel.Two)),
      )
      .addActionRowComponents(this.buildResourcesLinks());

    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      options: {
        allowedMentions: {
          parse: [],
          users: [],
        },
      },
    });
  }
}
