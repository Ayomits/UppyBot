import type { MonitoringType } from "#/discord/app/public/reminder/reminder.const.js";

import { BumpLogSourceType } from "../models/bump-log.model.js";
import { BumpGuildCalendarRepository } from "../repositories/bump-guild-calendar.repository.js";
import { BumpLogRepository } from "../repositories/bump-log-repository.js";
import { BumpUserRepository } from "../repositories/bump-user.repository.js";

export async function createBump({
  guildId,
  executorId,
  points = 0,
  type,
  messageId = null,
  source = BumpLogSourceType.Web,
  timestamp = new Date(),
}: {
  guildId: string;
  executorId: string;
  points: number;
  type: number | MonitoringType;
  messageId?: string | null;
  source?: number;
  timestamp?: Date;
}) {
  const bumpGuildCalendar = BumpGuildCalendarRepository.create();
  const bumpUserRepository = BumpUserRepository.create();
  const bumpLogRepository = BumpLogRepository.create();
  await Promise.all([
    bumpLogRepository.createLog({
      guildId,
      executorId,
      messageId,
      points,
      type,
      source,
      timestamp,
    }),
    bumpGuildCalendar.pushToCalendar(guildId),
    bumpUserRepository.update(guildId, executorId, points, type),
  ]);
}
