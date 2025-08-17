import { configService } from "@fear/config";
import { createProject, IMPORT_PATTERN } from "@fear/starter";
import { glob } from "fs";

glob(IMPORT_PATTERN, (_, matches) =>
  matches.forEach((m) => import(`.${m.replace("dist", "")}`))
);

createProject(configService.get("DISCORD_TOKEN"), {
  env: configService.get("APP_ENV"),
});
