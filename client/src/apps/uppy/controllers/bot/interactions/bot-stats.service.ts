import type { ChatInputCommandInteraction } from "discord.js";
import { injectable } from "tsyringe";

@injectable()
export class UppyBotStatsService {
  async handleStats(interaction: ChatInputCommandInteraction) {}
}
