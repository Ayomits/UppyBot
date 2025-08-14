import type { LiteralEnum } from "@ts-fetcher/types";

export const DefaultColors = {
  Default: 0x2c2f33,
  Error: 0xf44336,
} as const;

export type DefaultColors = LiteralEnum<typeof DefaultColors>;
