"use client"
import { createContext } from "#/lib/create-context";

export const {
  Provider: DashboardSettingsProvider,
  useSelect: useDasboardSettings,
} = createContext<{ guildId: string }>();
