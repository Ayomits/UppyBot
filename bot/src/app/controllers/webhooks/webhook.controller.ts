import type {
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { Discord, ModalComponent, Slash, SlashGroup } from "discordx";
import { inject, singleton } from "tsyringe";

import { WebhookIds } from "./webhook.const.js";
import { WebhookService } from "./webhook.service.js";

@Discord()
@singleton()
@SlashGroup({
  name: "webhook",
  description: "Управление системой веб-хуков",
  defaultMemberPermissions: ["Administrator"],
})
@SlashGroup("webhook")
export class WebhookController {
  constructor(@inject(WebhookService) private webhookService: WebhookService) {}

  @Slash({ name: "setup", description: "Настроить систему веб-хуков" })
  handleWebhookSetup(interaction: ChatInputCommandInteraction) {
    return this.webhookService.handleWebhookSetup(interaction);
  }

  @ModalComponent({ id: WebhookIds.setup })
  handleWebhookSetupModal(interaction: ModalSubmitInteraction) {
    return this.webhookService.handleWebhookSetupModal(interaction);
  }

  @Slash({ name: "test", description: "Отправить тестовое уведомление" })
  handleWebhookTest(interaction: ChatInputCommandInteraction) {
    return this.webhookService.handleWebhookTest(interaction);
  }

  @Slash({ name: "token-reveal", description: "Сбросить токен" })
  handleWebhookReveal(interaction: ChatInputCommandInteraction) {
    return this.webhookService.handleWebhookTokenReveal(interaction);
  }
}
