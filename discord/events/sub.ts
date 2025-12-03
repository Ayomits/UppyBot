import { injectable } from "tsyringe";

import { AppBumpBanEventHandler } from "./handlers/bump-ban.js";
import { AppCommandEventHandler } from "./handlers/commands.js";
import { AppPremiumEventHandler } from "./handlers/premium.js";
import { AppRemindEventHandler } from "./handlers/reminds.js";

@injectable()
export class AppEventSubscriber {
  constructor() {
    AppBumpBanEventHandler.create();
    AppCommandEventHandler.create();
    AppPremiumEventHandler.create();
    AppRemindEventHandler.create();
  }
}
