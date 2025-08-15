import { configService } from "@fear/config";
import mongoose from "mongoose";
import { injectable } from "tsyringe";

@injectable()
export class CoreService {
  async handleReady() {
    return await Promise.all([this.connectToDb()]);
  }

  private async connectToDb(): Promise<void> {
    await mongoose.connect(configService.get("MONGO_URL"));
  }
}
