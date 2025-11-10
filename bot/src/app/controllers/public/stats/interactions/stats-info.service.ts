import { dirname } from "@discordx/importer";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  User,
  UserContextMenuCommandInteraction,
} from "discord.js";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
} from "discord.js";
import path from "path";
import { inject, injectable } from "tsyringe";
import { pathToFileURL } from "url";

import { UppyInfoMessage } from "#/app/messages/stats-info.message.js";
import { BumpBanModel } from "#/db/models/bump-ban.model.js";
import type { BumpUserDocument } from "#/db/models/bump-user.model.js";
import { BumpUserRepository } from "#/db/repositories/bump-user.repository.js";
import { SettingsRepository } from "#/db/repositories/settings.repository.js";
import { drawRoundedImage } from "#/libs/canvas/index.js";
import { createSafeCollector } from "#/libs/djs/collector.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";
import { sum } from "#/libs/number/sum.js";
import { formatDate } from "#/libs/time/to-format.js";

import { BumpBanService } from "../../bump-ban/bump-ban.service.js";
import { BumpBanLimit, MonitoringType } from "../../reminder/reminder.const.js";
import { StaffCustomIds } from "../stats.const.js";
import { BaseUppyService } from "../stats.service.js";

@injectable()
export class UppyInfoService extends BaseUppyService {
  constructor(
    @inject(BumpBanService) private bumpBanService: BumpBanService,
    @inject(SettingsRepository) private settingsRepository: SettingsRepository,
    @inject(BumpUserRepository) private bumpUserRepository: BumpUserRepository
  ) {
    super();
  }

  async handleInfoCommand(
    interaction:
      | ChatInputCommandInteraction
      | UserContextMenuCommandInteraction,
    user?: User,
    from?: string,
    to?: string
  ) {
    await interaction.deferReply();
    user = typeof user === "undefined" ? interaction.user : user;

    const { fromDate, toDate } = this.parseOptionsDateString(from, to);

    const [entry, bumpBan, settings] = await Promise.all([
      this.bumpUserRepository.findUser(
        interaction.guildId!,
        user.id,
        fromDate.toJSDate(),
        toDate.toJSDate()
      ),
      BumpBanModel.findOne({
        guildId: interaction.guildId,
        userId: user.id,
        type: MonitoringType.ServerMonitoring,
      }),
      this.settingsRepository.findGuildSettings(interaction.guildId!),
    ]);

    const [authorMember, targetMember] = await Promise.all([
      interaction.guild!.members.fetch(interaction.user.id),
      interaction.guild!.members.fetch(user.id),
    ]);

    const canManage = authorMember.roles.cache.some(
      (r) =>
        settings?.roles.managerRoles &&
        settings?.roles.managerRoles.includes(r.id)
    );
    const canRemove =
      bumpBan && (bumpBan?.removeIn ?? 0) < BumpBanLimit && canManage;

    const removeBumpBan = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(UppyInfoMessage.buttons.actions.removeBumpBan.label)
        .setCustomId(StaffCustomIds.info.buttons.actions.removeBumpBan)
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!canRemove)
    );

    const banner = new AttachmentBuilder(
      await this.drawBanner(
        user,
        entry[0],
        `${formatDate(fromDate.toJSDate())}-${formatDate(toDate.toJSDate())}`
      )
    ).setName("image.png");

    const container = new ContainerBuilder()
      .addMediaGalleryComponents((builder) =>
        builder.addItems((builder) =>
          builder
            .setDescription("Баннер пользователя")
            .setURL("attachment://image.png")
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents(removeBumpBan);

    const repl = await interaction.editReply({
      components: [container],
      files: [banner],
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

  private async drawBanner(
    user: User,
    entry: Partial<BumpUserDocument> | undefined | null,
    interval: string
  ) {
    const canvas = createCanvas(680, 240);

    const ctx = canvas.getContext("2d");

    const root = `../../../../../../..`;

    const bannerPath = path.join(
      dirname(import.meta.url),
      `${root}/assets/images/user-profile.png`
    );

    const fontPath = path.join(
      dirname(import.meta.url),
      `${root}/assets/fonts/Onest-ExtraBold.ttf`
    );

    GlobalFonts.registerFromPath(fontPath, "onest-extrabold");

    ctx.fillStyle = "black";
    ctx.strokeStyle = "#000000";
    ctx.font = "15px onest-extrabold";
    ctx.textAlign = "left";

    const bannerImage = await loadImage(pathToFileURL(bannerPath));

    ctx.drawImage(bannerImage, 0, 0);

    drawRoundedImage(
      ctx,
      await loadImage(UsersUtility.getAvatar(user, { avatar: { size: 4096 } })),
      36,
      29.5,
      183,
      180
    );

    const baseCoordinates = { x: 317, y: 74 };

    function getMaxStringLength(str: string) {
      const maxLength = 18;
      return str.length > maxLength ? str.slice(0, maxLength - 3) + "..." : str;
    }

    // Левая строка (ник)

    ctx.fillText(
      getMaxStringLength(UsersUtility.getUsername(user)),
      baseCoordinates.x + 40,
      baseCoordinates.y + 26,
      105
    );

    // Нижняя (команды)
    ctx.fillText(
      getMaxStringLength(
        sum(
          entry?.dsMonitoring ?? 0,
          entry?.sdcMonitoring ?? 0,
          entry?.serverMonitoring ?? 0,
          entry?.disboardMonitoring ?? 0
        ).toString()
      ),
      baseCoordinates.x + 40,
      baseCoordinates.y + 26 + 50,
      105
    );

    // Правая строка (дата)

    ctx.fillText(
      getMaxStringLength(interval),
      baseCoordinates.x + 40 + 174,
      baseCoordinates.y + 26,
      105
    );

    // Нижняя (поинты)
    ctx.fillText(
      getMaxStringLength((entry?.points ?? 0).toString()),
      baseCoordinates.x + 40 + 174,
      baseCoordinates.y + 26 + 50,
      105
    );

    return canvas.toBuffer("image/png");
  }

  private async handleBumpBanRemoval(
    interaction: ButtonInteraction,
    member: GuildMember
  ) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const [settings, bumpBan] = await Promise.all([
      this.settingsRepository.findGuildSettings(interaction.guildId!),
      BumpBanModel.findOne({ guildId: interaction.guildId, userId: member.id }),
    ]);

    if (!bumpBan) {
      return interaction.editReply({
        content: UppyInfoMessage.errors.noBumpBan,
      });
    }

    const authorMember = interaction.member as GuildMember;

    if (!settings?.bumpBan.roleId) {
      return interaction.editReply({
        content: UppyInfoMessage.errors.notSetUpped,
      });
    }

    if (
      !authorMember.roles.cache.some(
        (r) =>
          settings?.roles.managerRoles &&
          settings?.roles.managerRoles.includes(r.id)
      )
    ) {
      return interaction.editReply({
        content: UppyInfoMessage.errors.forbidden,
      });
    }

    await this.bumpBanService.removeBumpBan({
      member,
      type: bumpBan.type,
      settings,
      force: {
        shouldDbQuery: true,
        shouldRoleAction: true,
      },
    });

    return interaction.editReply({
      content: UppyInfoMessage.buttons.actions.removeBumpBan.success,
    });
  }
}
