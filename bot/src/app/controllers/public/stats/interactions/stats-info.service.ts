import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  User,
  UserContextMenuCommandInteraction,
} from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  heading,
  HeadingLevel,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
import { inject, injectable } from "tsyringe";

import { UppyInfoMessage } from "#/app/messages/stats-info.message.js";
import { BumpBanModel } from "#/db/models/bump-ban.model.js";
import { BumpUserRepository } from "#/db/repositories/bump-user.repository.js";
import { SettingsRepository } from "#/db/repositories/settings.repository.js";
import { UsersUtility } from "#/libs/embed/users.utility.js";
import { createSafeCollector } from "#/libs/utils/collector.js";

import { BumpBanService } from "../../bump-ban/bump-ban.service.js";
import { BumpBanLimit } from "../../reminder/reminder.const.js";
import { StaffCustomIds } from "../stats.const.js";
import { BaseUppyService } from "../stats.service.js";

@injectable()
export class UppyInfoService extends BaseUppyService {
  constructor(
    @inject(BumpBanService) private bumpBanService: BumpBanService,
    @inject(SettingsRepository) private settingsRepository: SettingsRepository,
    @inject(BumpUserRepository) private bumpUserRepository: BumpUserRepository,
  ) {
    super();
  }

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
      this.bumpUserRepository.findUser(
        interaction.guildId!,
        user.id,
        fromDate.toJSDate(),
        toDate.toJSDate(),
      ),
      BumpBanModel.findOne({
        guildId: interaction.guildId,
        userId: user.id,
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
        settings?.roles.managerRoles.includes(r.id),
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
          settings?.roles.managerRoles.includes(r.id),
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
