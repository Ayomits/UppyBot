import type { Remind } from "#/shared/db/models/uppy-discord/remind.model.js";
import type { Settings } from "#/shared/db/models/uppy-discord/settings.model.js";

import type { MonitoringType } from "../app/public/reminder/reminder.const.js";

export type AppEventOptions = {
  guildId: string;
  userId: string;
  type: MonitoringType | number;
  settings: Partial<Settings>;
  avatarUrl?: string;
};

export type AppCommandSuccessOptions = AppEventOptions & {
  points: number;
  reactionTime: string;
  channelId: string;
};

export type AppEventHandler<T> = (options: T) => void | Promise<void>;

export type AppPremiumCreated = {
  guildName: string;
  guildAvatar: string;
  until: Date;
};

export type AppPremiumExpired = {
  guildId: string;
  guildName: string;
  guildAvatar: string;
  created: Date;
};

export type AppRemindExecute = Omit<AppEventOptions, "userId" | "avatarUrl"> &
  Partial<Remind>;

export type AppEvents = {
  readonly "bump-ban:created": AppEventHandler<AppEventOptions>;
  readonly "bump-ban:removed": AppEventHandler<AppEventOptions>;

  readonly "command:executed": AppEventHandler<AppCommandSuccessOptions>;

  readonly "premium:expired": AppEventHandler<AppPremiumExpired>;
  readonly "premium:created": AppEventHandler<AppPremiumCreated>;

  readonly "remind:common": AppEventHandler<AppRemindExecute>;
  readonly "remind:force": AppEventHandler<AppRemindExecute>;

  readonly "settings:updated": AppEventHandler<Partial<Settings>>;
};
