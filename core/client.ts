import { GatewayIntentBits } from "discord.js";
import { Client } from "discordx";

export const coreClient = new Client({
  intents: [
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});
