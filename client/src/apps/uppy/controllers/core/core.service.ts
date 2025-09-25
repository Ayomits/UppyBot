import { type CommandInteraction, MessageFlags } from "discord.js";
import { injectable } from "tsyringe";

import type { LatencyService } from "#/shared/services/latency.service.js";

@injectable()
export class CoreService {
  constructor(private latencyService: LatencyService) {}

  handleReady() {}

  async handleLatency(interaction: CommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  }
}
