import dt from "dotenv";
import * as glob from "glob";
import path from "path";

const rootPath = path.resolve(path.dirname("./"), "../../..");

export class ConfigService {
  constructor() {
    const envFiles = glob.sync(`${rootPath}/**/.env`, {
      ignore: ["node_modules/**"],
    });

    envFiles.forEach((path) => {
      dt.config({ path });
    });
  }

  public get<T = string>(key: string, default_?: T): T {
    return (process.env[key] ?? default_) as T;
  }

  public getOrThrow<T = string>(key: string, default_?: T): T {
    const existed = this.get<T>(key, default_);
    if (!existed) {
      throw new Error(`Environment key ${key} does not exists`);
    }
    return existed;
  }
}

export const configService = new ConfigService();

export const Env = {
  AppEnv: configService.get("APP_ENV"),
  HelperToken: configService.get("DISCORD_TOKEN"),
  MongoUrl: configService.get("MONGO_URL"),
} as const;
