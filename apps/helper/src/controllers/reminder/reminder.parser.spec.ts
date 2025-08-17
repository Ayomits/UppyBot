/* eslint-disable @typescript-eslint/no-explicit-any */
import "reflect-metadata";

import type { Message } from "discord.js";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  MonitoringBot,
  MonitoringBotMessage,
  RemindType,
} from "./reminder.const";
import { ReminderParser } from "./reminder.parser";

const now = new Date();
const guildId = "123";
const userId = "1234";

function createMockMessage(partial: Partial<Message>): Message {
  return {
    author: { id: userId } as any,
    guildId: guildId,
    embeds: [],
    interactionMetadata: { user: { id: userId } } as any,
    ...partial,
  } as Message;
}

function createMockEmbed(description: string, timestamp?: Date) {
  return {
    description,
    timestamp: timestamp?.getTime(),
  };
}

describe("ReminderParser", () => {
  let parser: ReminderParser;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);

    parser = new ReminderParser();
  });

  beforeEach(() => {
    parser = new ReminderParser();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("getHandler", () => {
    expect(parser.getHandler(MonitoringBot.DiscordMonitoring)).toBe(
      parser.handleDiscordMonitoring,
    );

    expect(parser.getHandler(MonitoringBot.ServerMonitoring)).toBe(
      parser.handleServerMonitoring,
    );

    expect(parser.getHandler(MonitoringBot.SdcMonitoring)).toBe(
      parser.handleSdcMonitoring,
    );
  });

  test("handleDiscordMonitoring (success russian)", () => {
    expect(
      parser.handleDiscordMonitoring(
        createMockMessage({
          guildId: guildId,
          embeds: [
            // @ts-expect-error its test
            createMockEmbed(
              MonitoringBotMessage.discordMonitoring.success[0],
              now,
            ),
          ],
        }) as any,
      ),
    ).toStrictEqual(
      parser.handleSuccess(now, guildId, userId, RemindType.DiscordMonitoring),
    );
  });

  test("handleDiscordMonitoring (success english)", () => {
    expect(
      parser.handleDiscordMonitoring(
        createMockMessage({
          guildId: guildId,
          embeds: [
            // @ts-expect-error its test
            createMockEmbed(
              MonitoringBotMessage.discordMonitoring.success[1],
              now,
            ),
          ],
        }) as any,
      ),
    ).toStrictEqual(
      parser.handleSuccess(now, guildId, userId, RemindType.DiscordMonitoring),
    );
  });

  test("handleDiscordMonitoring (failure english)", () => {
    expect(
      parser.handleDiscordMonitoring(
        createMockMessage({
          guildId: guildId,
          embeds: [
            // @ts-expect-error its test
            createMockEmbed(
              MonitoringBotMessage.discordMonitoring.failure[1],
              now,
            ),
          ],
        }) as any,
      ),
    ).toStrictEqual(
      parser.handleFailure(now, guildId, userId, RemindType.DiscordMonitoring),
    );
  });

  test("handleDiscordMonitoring (failure russian)", () => {
    expect(
      parser.handleDiscordMonitoring(
        createMockMessage({
          guildId: guildId,
          embeds: [
            // @ts-expect-error its test
            createMockEmbed(
              MonitoringBotMessage.discordMonitoring.failure[1],
              now,
            ),
          ],
        }) as any,
      ),
    ).toStrictEqual(
      parser.handleFailure(now, guildId, userId, RemindType.DiscordMonitoring),
    );
  });

  test("handleDiscordMonitoring (failure another language)", () => {
    expect(
      parser.handleDiscordMonitoring(
        createMockMessage({
          guildId: guildId,
          embeds: [
            // @ts-expect-error its test
            createMockEmbed("92482340", now),
          ],
        }) as any,
      ),
    ).toStrictEqual(
      parser.handleFailure(now, guildId, userId, RemindType.DiscordMonitoring),
    );
  });

  test("handleSdcMonitoring (success)", () => {
    const timestamp = now.getTime();
    expect(
      parser.handleSdcMonitoring(
        createMockMessage({
          embeds: [
            // @ts-expect-error its tests
            createMockEmbed(
              MonitoringBotMessage.sdcMonitoring.success +
                " " +
                `<t:${timestamp}:R>`,
            ),
          ],
        }),
      ),
    ).toStrictEqual(
      parser.handleSuccess(now, guildId, userId, RemindType.SdcMonitoring),
    );
  });

  test("handleSdcMonitoring (failure)", () => {
    expect(
      parser.handleSdcMonitoring(
        createMockMessage({
          embeds: [
            // @ts-expect-error its tests
            createMockEmbed(
              MonitoringBotMessage.sdcMonitoring.failure +
                " " +
                `<t:${now.getTime()}:R>`,
            ),
          ],
        }),
      ),
    ).toStrictEqual(
      parser.handleFailure(now, guildId, userId, RemindType.SdcMonitoring),
    );
  });

  test("handleServerMonitoring (success)", () => {
    const timestamp = new Date(now.getTime() + 3_600 * 4 * 1_000);

    expect(
      parser.handleServerMonitoring(
        createMockMessage({
          embeds: [
            // @ts-expect-error its tests
            createMockEmbed(MonitoringBotMessage.serverMonitoring.success),
          ],
        }),
      ),
    ).toStrictEqual(
      parser.handleSuccess(
        timestamp,
        guildId,
        userId,
        RemindType.ServerMonitoring,
      ),
    );
    expect(
      parser.handleServerMonitoring(
        createMockMessage({
          embeds: [
            // @ts-expect-error its tests
            createMockEmbed(
              MonitoringBotMessage.serverMonitoring.failure + " " + "04:00:00",
            ),
          ],
        }),
      ),
    ).toStrictEqual(
      parser.handleFailure(
        timestamp,
        guildId,
        userId,
        RemindType.ServerMonitoring,
      ),
    );
  });
});
