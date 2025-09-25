import { type CommandInteraction, MessageFlags } from "discord.js";
import { inject, injectable } from "tsyringe";

import { LatencyService } from "#/shared/services/latency.service.js";

@injectable()
export class CoreService {
  constructor(@inject(LatencyService) private latencyService: LatencyService) {}

  handleReady() {}

  async handleLatency(interaction: CommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  }
}
