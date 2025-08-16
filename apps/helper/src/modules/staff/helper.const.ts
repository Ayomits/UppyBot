import type { LiteralEnum } from "@fear/utils";

export const BumpBanButtonId = "BumpBanButton";
export const BumpRemainingRefreshButtonId = "bumpreminderstaturefresh";

export const Period = {
  Weekly: "weekly",
  TwoWeeks: "twoweeks",
  AllTime: "alltime",
} as const;

export type Period = LiteralEnum<typeof Period>;
