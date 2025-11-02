import type { ButtonInteraction } from "discord.js";
import {
  bold,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ContainerBuilder,
  heading,
  HeadingLevel,
  inlineCode,
  MessageFlags,
  orderedList,
} from "discord.js";
import { injectable } from "tsyringe";

import { UppyLinks } from "#/const/links.js";
import { Requisits } from "#/const/requisits.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";

@injectable()
export class PremiumSubscribeCommandService {
  static create() {
    return new PremiumSubscribeCommandService();
  }

  async handleSubscribeCommand(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
  ) {
    await interaction.deferReply();
    const container = new ContainerBuilder()
      .addSectionComponents((builder) =>
        builder
          .addTextDisplayComponents((builder) =>
            builder.setContent(
              [
                heading("Информация про премиум", HeadingLevel.Two),
                "",
                `СТОИМОСТЬ ПОДПИСКИ - ${bold("122 рубля МЕСЯЦ")}`,
                heading("В премиум подписку входит", HeadingLevel.Two),
                orderedList([
                  "Возможность поставить свой аватар и баннер для сервера",
                  "Возможность настроить преждевременные напоминания",
                ]),
                heading("Как купить?", HeadingLevel.Two),
                "",
                orderedList([
                  `Зайдите на сервер поддержки ${UppyLinks.SupportServer}`,
                  `Напишите в личные сообщения овнеру ${inlineCode(`ayomi.dev (1129162686194790572)`)}, что хотите купить подписку`,
                ]),
                `Реквизиты:`,
                orderedList([`Т-БАНК: ${Requisits.TBank}`]),
                "",
                "На данный момент нет способа купить подписку автоматически",
                "Возврат средств не предусмотрен",
              ].join("\n"),
            ),
          )
          .setThumbnailAccessory((buidler) =>
            buidler.setURL(UsersUtility.getAvatar(interaction.user)),
          ),
      )
      .addActionRowComponents((row) =>
        row.addComponents(
          new ButtonBuilder()
            .setLabel("Написать")
            .setURL("https://discord.com/users/1129162686194790572")
            .setStyle(ButtonStyle.Link),
        ),
      );

    return interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }
}
