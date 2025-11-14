import { config } from "dotenv";

export class ConfigService {
  constructor() {
    config({ quiet: true });
  }

  static create() {
    return new ConfigService();
  }

  get(key: string) {
    return process.env[key];
  }

  getOrThrow(key: string, errorMsg?: string) {
    const value = this.get(key);
    if (!value) {
      throw new Error(errorMsg ?? `Not value provided by key ${key}`);
    }
    return value;
  }
}
