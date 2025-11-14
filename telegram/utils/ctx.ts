import type { EmojiFlavor } from "@grammyjs/emoji";
import type { HydrateFlavor } from "@grammyjs/hydrate";
import type { Context } from "grammy";

export type AppContext = HydrateFlavor<Context> & EmojiFlavor;
