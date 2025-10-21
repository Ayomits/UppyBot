"use client";

import { useGetDiscordGuilds } from "#/api/queries/use-get-discord-guilds";
import { Avatar, AvatarFallback, AvatarImage } from "#/ui/avatar";
import { useDasboardSettings } from "../_context/settings-context";
import { Skeleton } from "#/ui/skeleton";

export function DashboardSettingsSidebarHeader() {
  const { guildId } = useDasboardSettings((v) => v);
  const guilds = useGetDiscordGuilds();

  const guild = guilds.isLoading
    ? null
    : guilds.data?.items.find((g) => g.id === guildId)!;

  return (
    <div className="flex items-center gap-2.5">
      <Avatar className="size-16">
        {guilds.isLoading ? (
          <AvatarFallback className="bg-secondary" />
        ) : (
          <AvatarImage src={guild?.icon!} />
        )}
      </Avatar>
      {guilds.isLoading ? (
        <Skeleton className="bg-secondary h-3 w-24" />
      ) : (
        <span className="text-lg max-w-54 truncate">{guild!.name}</span>
      )}
    </div>
  );
}
