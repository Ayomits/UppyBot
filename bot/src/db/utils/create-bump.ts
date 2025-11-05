import type { MonitoringType } from "#/app/controllers/public/reminder/reminder.const.js";

import { BumpLogModel, BumpLogSourceType } from "../models/bump-log.model.js";
import { BumpGuildCalendarRepository } from "../repositories/bump-guild-calendar.repository.js";
import { BumpUserRepository } from "../repositories/bump-user.repository.js";

export async function createBump(
  guildId: string,
  executorId: string,
  points: number,
  type: number | MonitoringType,
  messageId: string | null = null,
  source: number = BumpLogSourceType.Discord,
  timestamp: Date = new Date()
) {
  const bumpGuildCalendar = BumpGuildCalendarRepository.create();
  const bumpUserRepository = BumpUserRepository.create();
  await Promise.all([
    BumpLogModel.create({
      guildId,
      executorId,
      messageId,
      points,
      type,
      source,
      createdAt: timestamp,
    }),
    bumpGuildCalendar.pushToCalendar(guildId),
    bumpUserRepository.update(guildId, executorId, points, type),
  ]);
}
