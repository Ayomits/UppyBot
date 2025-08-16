import { configService } from "@fear/config";
import { createProject } from "@fear/starter";

createProject(configService.get("DISCORD_TOKEN"), {
  env: configService.get("APP_ENV", "dev"),
});
