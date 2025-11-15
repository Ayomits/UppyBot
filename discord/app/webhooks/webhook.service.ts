import type {
  Message,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  TextChannel,
} from "discord.js";
import {
  ActionRowBuilder,
  type ChatInputCommandInteraction,
  inlineCode,
  MessageFlags,
  ModalBuilder,
  spoiler,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputStyle,
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
import { WebhookIds } from "./webhook.const.js";

@injectable()
export class WebhookService {
  constructor(
    @inject(WebhookManager) private webhookManager: WebhookManager,
    @inject(CryptographyService) private cryptography: CryptographyService,
    @inject(SettingsRepository) private settingsRepository: SettingsRepository
  ) {}

  async handleWebhookSetup(interaction: ChatInputCommandInteraction) {
    const modal = new ModalBuilder()
      .setCustomId(WebhookIds.setup)
      .setTitle("Настройка вебхуков")
      .addLabelComponents((builder) =>
        builder
          .setLabel("URL")
          .setTextInputComponent((builder) =>
            builder
              .setCustomId("url")
              .setPlaceholder("Введите ссылку")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
      );
    return interaction.showModal(modal);
  }

  async handleWebhookSetupModal(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const url = interaction.fields.getTextInputValue("url");

    if (!url.startsWith("https://") && Env.AppEnv !== "dev") {
      return interaction.editReply({
        content: `URL должен начинатся с ${inlineCode(`https://`)}`,
      });
    }

    const token = this.cryptography.encrypt(interaction.id);
    const isSended = await this.webhookManager.sendNotification(
      url,
      token,
      this.webhookManager.createTestNotificationPayload(interaction.guildId!)
    );

    if (!isSended) {
      return interaction.editReply({
        content: "Не удалось выслать тестовое уведомление",
      });
    }

    await this.settingsRepository.update(interaction.guildId!, {
      webhooks: {
        url,
        token: this.cryptography.encrypt(token),
      },
    });

    return interaction.editReply({
      content: [
        "Тестовое уведомление успешно выслано",
        `Ваш токен: ${spoiler(token)}`,
      ].join("\n"),
    });
  }

  async handleWebhookTokenReveal(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const settings = await this.settingsRepository.findGuildSettings(
      interaction.guildId!
    );
    if (!settings.webhooks?.url) {
      return interaction.editReply({
        content: "У вас не включена система вебхуков",
      });
    }
    const token = this.cryptography.encrypt(interaction.id);

    await this.settingsRepository.update(interaction.guildId!, {
      "webhooks.token": this.cryptography.encrypt(token),
    });

    return interaction.editReply({
      content: `Токен сброшен: ${spoiler(token)}`,
    });
  }

  async handleWebhookTest(interaction: ChatInputCommandInteraction) {
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
      .setCustomId(WebhookIds.selectTest)
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
    const payload = this.webhookManager.createRemindPayload(
      interaction.guildId!,
      {
        channelName: (interaction.channel as TextChannel).name,
        commandName: `/${getCommandNameByRemindType(remindType)}`,
        guildName: interaction.guild!.name,
        type: remindType,
        aproximatedNotificationUsers: [interaction.user.id],
      }
    );

    return !!this.webhookManager.sendNotification(url, token, payload);
  }
}
