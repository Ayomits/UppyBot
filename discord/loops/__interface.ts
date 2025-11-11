import type { Client } from "discordx";

export interface Loop {
  create(client: Client): void | Promise<void>;
  task(client: Client): void | Promise<void>;
}
