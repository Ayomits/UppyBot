import type { Guild, Snowflake } from "discord.js";
import cron from "node-cron";
import type { Job } from "node-schedule";
import { scheduleJob } from "node-schedule";

import { type BumpReminderModuleDocument } from "#/db/models/bump-reminder.model.js";
import Logger from "#/utils/logger/index.js";

type ScheduleCallback = (
  guild: Guild,
  monitoring: string,
  type: "warning" | "event",
) => Promise<void>;

class ScheduleManager {
  private static cache = new Map<string, Job>();

  public static set(
    guild: Guild,
    monitoring: string,
    timestamps: {
      warning?: string | number | Date;
      event: string | number | Date;
    },
    callback: ScheduleCallback,
  ): void {
    const baseKey = this.generateKey(guild.id, monitoring);

    this.clear(`${baseKey}_warning`);
    this.clear(`${baseKey}_event`);

    if (timestamps.warning) {
      const warningDate = this.toDate(timestamps.warning);
      const warningKey = `${baseKey}_warning`;

      const warningJob = scheduleJob(warningDate, async () => {
        await callback(guild, monitoring, "warning");
      });

      this.cache.set(warningKey, warningJob);
    }

    const eventDate = this.toDate(timestamps.event);
    const eventKey = `${baseKey}_event`;

    const eventJob = scheduleJob(eventDate, async () => {
      await callback(guild, monitoring, "event");
    });

    this.cache.set(eventKey, eventJob);
  }

  public static remove(guild: Guild, monitoring: string): boolean {
    const baseKey = this.generateKey(guild.id, monitoring);
    const res1 = this.clear(`${baseKey}_warning`);
    const res2 = this.clear(`${baseKey}_event`);
    return res1 || res2;
  }

  public static has(guild: Guild, key: string): boolean {
    return this.cache.has(`${this.generateKey(guild.id, key)}`);
  }

  private static clear(key: string): boolean {
    const job = this.cache.get(key);
    if (!job) return false;
    job.cancel();
    this.cache.delete(key);
    return true;
  }

  private static generateKey(guildId: Snowflake, monitoring: string): string {
    return `${guildId}_${monitoring}`;
  }

  private static toDate(input: string | number | Date): Date {
    if (input instanceof Date) return input;
    if (typeof input === "number") return new Date(input);
    return new Date(Date.parse(input));
  }

  public static startRecoveryInterval(
    guilds: Guild[],
    fetchSettings: (guild: Guild) => Promise<{
      bumpSettings: BumpReminderModuleDocument;
      keys: string[];
    }>,
    callback: ScheduleCallback,
  ) {
    cron.schedule("*/30 * * * * *", async () => {
      for (const guild of guilds) {
        try {
          const { bumpSettings, keys } = await fetchSettings(guild);
          if (!bumpSettings || !bumpSettings.enable) continue;

          const now = new Date();

          for (const key of keys) {
            const warningTime = bumpSettings[key]?.warning;
            const eventTime = bumpSettings[key]?.next;

            if (!eventTime || eventTime <= now) continue;
            if (!warningTime || warningTime <= now) continue;

            const baseKey = this.generateKey(guild.id, key);

            const hasWarning = this.cache.has(`${baseKey}_warning`);
            const hasEvent = this.cache.has(`${baseKey}_event`);

            if (!hasWarning || !hasEvent) {
              Logger.info(
                `[RecoveryCron] Восстановление ${key} в ${guild.name}`,
              );
              this.set(
                guild,
                key,
                { warning: warningTime, event: eventTime },
                callback,
              );
            }
          }
        } catch (error) {
          Logger.error(
            `[RecoveryCron] Ошибка при восстановлении в ${guild.name}:`,
            error,
          );
        }
      }
    });
  }
}

export default ScheduleManager;
