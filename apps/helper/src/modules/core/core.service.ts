import { ConfigService } from "@fear/config";
import mongoose from "mongoose";
import { injectable } from "tsyringe";

@injectable()
export class CoreService {
  async handleReady() {
    return await Promise.all([this.connectToDb()]);
  }

  private async connectToDb(): Promise<void> {
    const config = new ConfigService();
    await mongoose.connect(config.get("MONGO_URL"));
  }
}
