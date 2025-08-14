import mongoose from "mongoose";
import { injectable } from "tsyringe";

import { configService } from "#/libs/core/config.service.js";
import Logger from "#/utils/logger/index.js";

@injectable()
export class CoreService {
  async handleReady() {
    return await Promise.all([
      this.connectToDb()
        .then(() => Logger.info(`Successfully connect to db`))
        .catch((err) => Logger.error(err)),
    ]);
  }

  private async connectToDb(): Promise<void> {
    await mongoose.connect(configService.get("MONGO_URL")).catch(Logger.error);
  }
}
