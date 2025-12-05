import type { ChatInputCommandInteraction } from "discord.js";
import { Discord, Slash, SlashGroup } from "discordx";
import { inject, singleton } from "tsyringe";

import { NotificationsService } from "./notifications.service.js";

@Discord()
@singleton()
@SlashGroup({
  name: "notifications",
  description: "Управление системой уведомления в телеграмме",
  defaultMemberPermissions: ["Administrator"],
})
@SlashGroup("notifications")
export class NotificationsController {
  constructor(
    @inject(NotificationsService)
    private notificationService: NotificationsService,
  ) {}

  @Slash({ name: "test", description: "Отправить тестовое уведомление" })
  handleNotificationTest(interaction: ChatInputCommandInteraction) {
    return this.notificationService.handleNotificationTest(interaction);
  }
}
