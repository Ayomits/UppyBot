/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AppContext } from "#/telegram/utils/ctx.js";

export type AppCommand = (ctx: AppContext) => any | Promise<any>;
