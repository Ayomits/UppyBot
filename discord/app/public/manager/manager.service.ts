import type {
  ButtonInteraction,
  GuildChannel,
  ModalSubmitInteraction,
} from "discord.js";
import {
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ContainerBuilder,
  heading,
  MessageFlags,
  ModalBuilder,
  TextInputStyle,
} from "discord.js";
import type { Client } from "discordx";
import { inject, injectable } from "tsyringe";

import { IsManager } from "#/discord/guards/is-manager.js";
import { BumpBanModel } from "#/shared/db/models/uppy-discord/bump-ban.model.js";
import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { createSafeCollector } from "#/shared/libs/djs/collector.js";
import { UsersUtility } from "#/shared/libs/embed/users.utility.js";
import { CustomIdParser } from "#/shared/libs/parser/custom-id.parser.js";

import { BumpBanService } from "../bump-ban/bump-ban.service.js";
import { BumpBanLimit, MonitoringType } from "../reminder/reminder.const.js";
import { ManagerPanelAction, ManagerPanelIds } from "./manager.const.js";

@injectable()
export class ManagerService {
  constructor(
    @inject(BumpBanService) private bumpBanService: BumpBanService,
    @inject(SettingsRepository) private settingsRepository: SettingsRepository
  ) {}

  async handleManagerPanel(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const container = new ContainerBuilder()
      .addSectionComponents((builder) =>
        builder
          .setThumbnailAccessory((builder) =>
            builder.setURL(UsersUtility.getAvatar(interaction.user))
          )
          .addTextDisplayComponents((builder) =>
            builder.setContent(
              [
                heading("Добро пожаловать"),
                "Это ваша личная панель менеджера, где вы сможете совершать действия над участниками",
              ].join("\n")
            )
          )
      )
      .addSeparatorComponents((builder) => builder.setDivider(true))
      .addActionRowComponents((row) =>
        row.addComponents(
          this.createManagerButton(
            "Выдать бамп бан",
            ManagerPanelAction.bumpBanCreation
          ),
          this.createManagerButton(
            "Снять бамп бан",
            ManagerPanelAction.bumpBanRemoval
          ),
          this.createManagerButton(
            "Открыть канал",
            ManagerPanelAction.channelOpen
          ),
          this.createManagerButton(
            "Закрыть канал",
            ManagerPanelAction.channelClose
          )
        )
      );

    const reply = await interaction.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });

    const collector = createSafeCollector(reply, {
      filter: (i) =>
        IsManager({
          arg: i,
          client: i.client as Client,
          guild: i.guild!,
          user: i.user,
        }),
    });

    collector.on("collect", (interaction) => {
      const [type] = CustomIdParser.parseArguments(interaction.customId, {});

      const handlers = {
        [ManagerPanelAction.bumpBanCreation]: () =>
          this.handleBumpBanAction
            .bind(this)(interaction, type)
            .catch(() => null),
        [ManagerPanelAction.bumpBanRemoval]: () =>
          this.handleBumpBanAction
            .bind(this)(interaction, type)
            .catch(() => null),
        [ManagerPanelAction.channelClose]: () =>
          this.handleChannelAction
            .bind(this)(interaction, type)
            .catch(() => null),
        [ManagerPanelAction.channelOpen]: () =>
          this.handleChannelAction
            .bind(this)(interaction, type)
            .catch(() => null),
      };

      return handlers?.[type]?.();
    });
  }

  async handleManagerModal(interaction: ModalSubmitInteraction) {
    const [type_] = CustomIdParser.parseArguments(interaction.customId, {});

    const handlers = {
      [ManagerPanelAction.bumpBanCreation]: () =>
        this.handleBumpBanModal.bind(this)(interaction, type_),
      [ManagerPanelAction.bumpBanRemoval]: () =>
        this.handleBumpBanModal.bind(this)(interaction, type_),
    };

    return handlers?.[type_]?.();
  }

  private async handleChannelAction(
    interaction: ButtonInteraction,
    type_: string
  ) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const settings = await this.settingsRepository.findGuildSettings(
      interaction.guildId!
    );

    if (!settings.channels.bumpChannelId) {
      return interaction.editReply({
        content: "На сервере не указан канал для команд",
      });
    }

    const channel = (await interaction.guild?.channels.fetch(
      settings.channels.bumpChannelId
    )) as GuildChannel;

    if (!channel) {
      return interaction.editReply({
        content: "Указанный в настройках канал для команд недействителен",
      });
    }

    let text: string = "";

    const errorMsg = "У бота недостаточно прав для редактирования канала";

    if (type_ === ManagerPanelAction.channelClose) {
      text = "Канал закрыт";
      await channel.permissionOverwrites
        .edit(interaction.guild!.roles.everyone, { SendMessages: false })
        .catch(() => (text = errorMsg));
    }

    if (type_ === ManagerPanelAction.channelOpen) {
      text = "Канал открыт";
      await channel.permissionOverwrites
        .edit(interaction.guild!.roles.everyone, { SendMessages: true })
        .catch(() => (text = errorMsg));
    }

    await interaction.editReply({ content: text });
  }

  private async handleBumpBanAction(
    interaction: ButtonInteraction,
    type: string
  ) {
    const settings = await this.settingsRepository.findGuildSettings(
      interaction.guildId!
    );

    if (!settings.bumpBan.enabled || !settings.bumpBan.roleId) {
      return interaction.reply({
        content: "Система бамп бан не настроена на сервере",
        flags: MessageFlags.Ephemeral,
      });
    }

    const role = await interaction.guild?.roles
      .fetch(settings.bumpBan.roleId)
      .catch(() => null);

    if (!role) {
      return interaction.reply({
        content: "Роль бамп бан недействительна",
        flags: MessageFlags.Ephemeral,
      });
    }

    const modal = new ModalBuilder()
      .setTitle("Бамп бан")
      .setCustomId(`${ManagerPanelIds.modal}_${type}`)
      .addLabelComponents((builder) =>
        builder
          .setLabel("Пользователь")
          .setUserSelectMenuComponent((builder) =>
            builder
              .setCustomId(ManagerPanelIds.usrSelect)
              .setPlaceholder("Выберите пользователя")
          )
      );

    if (type === ManagerPanelAction.bumpBanCreation) {
      modal.addLabelComponents((builder) =>
        builder
          .setLabel("Количество")
          .setTextInputComponent((builder) =>
            builder
              .setCustomId("count")
              .setPlaceholder("Количество бамп бан команд")
              .setMinLength(1)
              .setMaxLength(1)
              .setRequired(true)
              .setStyle(TextInputStyle.Short)
          )
      );
    }

    await interaction.showModal(modal);
  }

  private async handleBumpBanModal(
    interaction: ModalSubmitInteraction,
    type_: string
  ) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const user = interaction.fields
      .getSelectedUsers(ManagerPanelIds.usrSelect)
      ?.first();

    const bumpBanUser = await BumpBanModel.model.findOne({
      guildId: interaction.guildId,
      userId: user!.id,
    });

    const member = await interaction.guild?.members
      .fetch(user!.id)
      .catch(() => null);

    if (!member) {
      return interaction.editReply({ content: "Что-то пошло не так..." });
    }

    if (type_ === ManagerPanelAction.bumpBanCreation && bumpBanUser) {
      return interaction.editReply({
        content: "У пользователя уже есть бамп бан",
      });
    }

    if (type_ === ManagerPanelAction.bumpBanRemoval && !bumpBanUser) {
      return interaction.editReply({
        content: "У пользователя нет бамп бана",
      });
    }

    let text: string = "";

    switch (type_) {
      case ManagerPanelAction.bumpBanCreation: {
        text = "Бамп бан выдан";
        const count = Math.min(
          BumpBanLimit,
          Math.max(1, Number(interaction.fields.getTextInputValue("count")))
        );
        await this.bumpBanService.addBumpBan({
          member: member,
          type: MonitoringType.ServerMonitoring,
          counter: BumpBanLimit - count,
        });
        break;
      }
      case ManagerPanelAction.bumpBanRemoval:
        text = "Бамп бан снят";
        await this.bumpBanService.removeBumpBan({
          member: member,
          type: MonitoringType.ServerMonitoring,
        });
        break;
    }

    return interaction.editReply({
      content: text,
    });
  }

  private createManagerButton(text: string, type: ManagerPanelAction) {
    return new ButtonBuilder()
      .setLabel(text)
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(`${ManagerPanelIds.button}_${type}`);
  }
}
