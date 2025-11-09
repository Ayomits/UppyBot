import type {
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
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

import { SettingsRepository } from "#/db/repositories/settings.repository.js";
import { Env } from "#/libs/config/index.js";
import { CryptographyService } from "#/libs/crypto/index.js";
import { randomArrValue } from "#/libs/random/index.js";
import { createSafeCollector } from "#/libs/utils/collector.js";

import { MonitoringType } from "../public/reminder/reminder.const.js";
import { WebhookIds } from "./webhook.const.js";
import { WebhookManager } from "./webhook.manager.js";
import { WebhookNotificationType } from "./webhook.types.js";

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
      this.webhookManager.createTestRemindPayload()
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
    if (!settings.webhooks.url) {
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
    if (!settings.webhooks.url) {
      return interaction.editReply({
        content: "У вас не включена система вебхуков",
      });
    }
    const select = new StringSelectMenuBuilder()
      .setCustomId(WebhookIds.selectTest)
      .setPlaceholder("Выберите тип уведомления")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Команда выполнена успешно")
          .setValue(WebhookNotificationType.CommandSuccess.toString()),
        new StringSelectMenuOptionBuilder()
          .setLabel("Бамп бан выдан")
          .setValue(WebhookNotificationType.BumpBanCreation.toString()),
        new StringSelectMenuOptionBuilder()
          .setLabel("Бамп бан снят")
          .setValue(WebhookNotificationType.BumpBanRemoval.toString())
      );

    const repl = await interaction.editReply({
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
      ],
    });

    const collector = createSafeCollector(repl);
    collector.on(
      "collect",
      async (interaction: StringSelectMenuInteraction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const value = Number(interaction.values[0]);

        const settings = await this.settingsRepository.findGuildSettings(
          interaction.guildId!
        );

        if (!settings.webhooks.url) {
          return interaction.editReply({
            content: "У вас не включена система вебхуков",
          });
        }

        let isSended = false;
        const token = this.cryptography.decrypt(settings.webhooks.token!);
        const url = settings.webhooks.url;
        switch (value) {
          case WebhookNotificationType.CommandSuccess:
            isSended = !!this.webhookManager.sendNotification(
              url,
              token,
              this.webhookManager.createCommandExecutedPayload({
                channelId: interaction.channelId!,
                executedAt: new Date(),
                type: randomArrValue(Object.values(MonitoringType)),
                points: 10,
                userId: interaction.user.id,
              })
            );
            break;
          case WebhookNotificationType.BumpBanCreation:
          case WebhookNotificationType.BumpBanRemoval:
            isSended = !!this.webhookManager.sendNotification(
              url,
              token,
              this.webhookManager.createBumpBanPayload(value, {
                executedAt: new Date(),
                userId: interaction.user.id,
              })
            );
            break;
        }

        return interaction.editReply({
          content: isSended
            ? "Успешно выслано уведомление"
            : "Что-то пошло не так",
        });
      }
    );
  }
}
