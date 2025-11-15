import dt from "dotenv";

export class ConfigService {
  constructor() {
    dt.config();
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
  AppEnv: configService.get("APP_ENV", "dev"),

  EncryptionKey: configService.get("ENCRYPTION_KEY", "super-secret-key"),

  DiscordToken: configService.get("DISCORD_TOKEN"),

  UppyUrl: configService.get("UPPY_URL", "http://localhost:4200"),
  
  MongoUrl: configService.get(
    "MONGO_URL",
    "mongodb://localhost:27018/?authSource=admin",
  ),

  RedisHost: configService.get("REDIS_HOST", "localhost"),
  RedisPort: Number(configService.get("REDIS_PORT", "6379")),
  RedisUsername: configService.get("REDIS_USER", undefined),
  RedisPassword: configService.get("REDIS_PASSWORD", undefined),

  RabbitMQUri: configService.get("RABBITMQ_URI"),
} as const;
