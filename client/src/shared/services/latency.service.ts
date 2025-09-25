import { mongoose } from "@typegoose/typegoose";
import type { Client } from "discordx";
import { injectable } from "tsyringe";

@injectable()
export class LatencyService {
  public async mongoLatency() {
    const start = Date.now();
    try {
      const admin = mongoose.connection.db.admin();
      const ping = await admin.ping();
      if (!ping.ok) {
        return -1;
      }
      return Math.max(Date.now() - start, 1);
    } catch {
      return -1;
    }
  }

  public wsLatency(client: Client) {
    return Math.max(client.ws.ping, 1);
  }
}
