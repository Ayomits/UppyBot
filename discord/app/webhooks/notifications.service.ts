import type {
  Message,
  StringSelectMenuInteraction,
  TextChannel,
} from "discord.js";
import {
  ActionRowBuilder,
  type ChatInputCommandInteraction,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { inject, injectable } from "tsyringe";

import { SettingsRepository } from "#/shared/db/repositories/uppy-discord/settings.repository.js";
import { Env } from "#/shared/libs/config/index.js";
import { CryptographyService } from "#/shared/libs/crypto/index.js";
import { createSafeCollector } from "#/shared/libs/djs/collector.js";
import { randomArrValue } from "#/shared/libs/random/index.js";

import { WebhookManager } from "../../../shared/webhooks/webhook.manager.js";
import { WebhookNotificationType } from "../../../shared/webhooks/webhook.types.js";
import {
  getCommandNameByRemindType,
  MonitoringType,
} from "../public/reminder/reminder.const.js";
import { NotificationsIds } from "./notifications.const.js";

@injectable()
export class NotificationsService {
  constructor(
    @inject(WebhookManager) private webhookManager: WebhookManager,
    @inject(CryptographyService) private cryptography: CryptographyService,
    @inject(SettingsRepository) private settingsRepository: SettingsRepository
  ) {}

  async handleNotificationSetup(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const url = `${Env.UppyUrl}/uppy/notifications`;

    const token = this.cryptography.encrypt(interaction.id);
    const isSended = await this.webhookManager.sendNotification(
      url,
      token,
      this.webhookManager.createTestNotificationPayload(interaction.guildId!)
    );

    if (!isSended) {
      return interaction.editReply({
        content: "Произошла внутренняя ошибка, уведомления были не подключены",
      });
    }

    await this.settingsRepository.update(interaction.guildId!, {
      webhooks: {
        url,
        token: this.cryptography.encrypt(token),
      },
    });

    return interaction.editReply({
      content: ["Уведомления успешно подключены!"].join("\n"),
    });
  }

  async handleNotificationTest(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const settings = await this.settingsRepository.findGuildSettings(
      interaction.guildId!
    );
    if (!settings.webhooks?.url) {
      return interaction.editReply({
        content: "У вас не включена система вебхуков",
      });
    }

    const selectMenu = this.createTestNotificationSelectMenu();
    const reply = await interaction.editReply({
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          selectMenu
        ),
      ],
    });

    this.setupSelectMenuCollector(reply, interaction.guildId!);
  }

  private createTestNotificationSelectMenu(): StringSelectMenuBuilder {
    const options = [
      {
        label: "Команда выполнена успешно",
        value: WebhookNotificationType.CommandSuccess,
      },
      {
        label: "Бамп бан выдан",
        value: WebhookNotificationType.BumpBanCreation,
      },
      { label: "Бамп бан снят", value: WebhookNotificationType.BumpBanRemoval },
      { label: "Обычное напоминания", value: WebhookNotificationType.Remind },
      {
        label: "Преждевременное напоминания",
        value: WebhookNotificationType.ForceRemind,
      },
    ];

    return new StringSelectMenuBuilder()
      .setCustomId(NotificationsIds.selectTest)
      .setPlaceholder("Выберите тип уведомления")
      .addOptions(
        options.map((option) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(option.label)
            .setValue(option.value.toString())
        )
      );
  }

  private setupSelectMenuCollector(reply: Message, guildId: string): void {
    const collector = createSafeCollector(reply);

    collector.on(
      "collect",
      async (interaction: StringSelectMenuInteraction) => {
        await this.handleNotificationSelection(interaction, guildId);
      }
    );
  }

  private async handleNotificationSelection(
    interaction: StringSelectMenuInteraction,
    guildId: string
  ): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const settings = await this.settingsRepository.findGuildSettings(guildId);
    if (!settings.webhooks?.url) {
      await interaction.editReply({
        content: "У вас не включена система вебхуков",
      });
      return;
    }

    const notificationType = Number(interaction.values[0]);
    const isSended = await this.sendTestNotification(
      interaction,
      notificationType,
      settings.webhooks
    );

    await interaction.editReply({
      content: isSended ? "Успешно выслано уведомление" : "Что-то пошло не так",
    });
  }

  private async sendTestNotification(
    interaction: StringSelectMenuInteraction,
    notificationType: number,
    webhookConfig: { url: string; token: string }
  ): Promise<boolean> {
    const token = this.cryptography.decrypt(webhookConfig.token);
    const channel = interaction.channel as TextChannel;

    switch (notificationType) {
      case WebhookNotificationType.CommandSuccess:
        return this.sendCommandSuccessNotification(
          interaction,
          channel,
          webhookConfig.url,
          token
        );

      case WebhookNotificationType.BumpBanCreation:
      case WebhookNotificationType.BumpBanRemoval:
        return this.sendBumpBanNotification(
          interaction,
          notificationType,
          webhookConfig.url,
          token
        );

      case WebhookNotificationType.Remind:
      case WebhookNotificationType.ForceRemind:
        return this.sendRemindNotification(
          interaction,
          notificationType,
          webhookConfig.url,
          token
        );

      default:
        return false;
    }
  }

  private async sendCommandSuccessNotification(
    interaction: StringSelectMenuInteraction,
    channel: TextChannel,
    url: string,
    token: string
  ): Promise<boolean> {
    const payload = this.webhookManager.createCommandExecutedPayload(
      interaction.guildId!,
      {
        channelId: channel.id,
        executedAt: new Date(),
        type: randomArrValue(Object.values(MonitoringType)),
        points: 10,
        userId: interaction.user.id,
      }
    );

    return !!this.webhookManager.sendNotification(url, token, payload);
  }

  private async sendBumpBanNotification(
    interaction: StringSelectMenuInteraction,
    notificationType: number,
    url: string,
    token: string
  ): Promise<boolean> {
    const payload = this.webhookManager.createBumpBanPayload(
      interaction.guildId!,
      notificationType,
      {
        executedAt: new Date(),
        userId: interaction.user.id,
      }
    );

    return !!this.webhookManager.sendNotification(url, token, payload);
  }

  private async sendRemindNotification(
    interaction: StringSelectMenuInteraction,
    notificationType: WebhookNotificationType,
    url: string,
    token: string
  ): Promise<boolean> {
    const remindType = randomArrValue(Object.values(MonitoringType));
    const fn =
      notificationType === WebhookNotificationType.Remind
        ? this.webhookManager.createRemindPayload.bind(this.webhookManager)
        : this.webhookManager.createForceRemindPayload.bind(
            this.webhookManager
          );
    const payload = fn(interaction.guildId!, {
      channelName: (interaction.channel as TextChannel).name,
      commandName: `/${getCommandNameByRemindType(remindType)}`,
      guildName: interaction.guild!.name,
      type: remindType,
      aproximatedNotificationUsers: [interaction.user.id],
    });

    return !!this.webhookManager.sendNotification(url, token, payload);
  }
}
