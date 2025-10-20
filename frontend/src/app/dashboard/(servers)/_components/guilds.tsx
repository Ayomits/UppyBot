"use client";

import {
  useGetDiscordGuilds,
  UserDiscordGuild,
} from "#/api/queries/use-get-discord-guilds";
import { AppRoutes } from "#/const/routes";
import { CareteRightIcon } from "#/icons/carete.icon";
import { PlusIcon } from "#/icons/plus.icon";
import { cn } from "#/lib/cn";
import { Avatar, AvatarFallback, AvatarImage } from "#/ui/avatar";
import { Item } from "#/ui/item";
import { Skeleton } from "#/ui/skeleton";
import Image from "next/image";
import Link from "next/link";

export function DiscordGuildList() {
  const discordGuilds = useGetDiscordGuilds();
  const items = discordGuilds.isLoading
    ? Array(12).fill(null)
    : discordGuilds.data?.items;

  return items?.map((i, idx) => (
    <DiscordGuild isLoading={discordGuilds.isLoading} key={idx} {...i} />
  ));
}

export function DiscordGuild({
  id,
  name,
  icon,
  inviteLink,
  invited,
  isLoading,
}: Partial<UserDiscordGuild> & { isLoading: boolean }) {
  const Component = isLoading ? "div" : Link;
  return (
    <Item
      asChild
      className={cn(
        "px-6 py-4.5 transition-colors duration-300",
        !isLoading && "hover:bg-secondary"
      )}
    >
      <Component
        href={invited ? AppRoutes.Settings(id!) : inviteLink!}
        className="flex items-center justify-between"
      >
        <div
          className={cn(
            "flex items-center gap-2.5",
            !invited && !isLoading && "opacity-80"
          )}
        >
          <Avatar className="size-16">
            {isLoading ? (
              <AvatarFallback className="bg-secondary" />
            ) : (
              <AvatarImage src={icon!} />
            )}
          </Avatar>
          {isLoading ? (
            <Skeleton className="h-4 w-24 bg-secondary" />
          ) : (
            <span className="text-lg">{name}</span>
          )}
        </div>
        {!isLoading &&
          (invited ? (
            <CareteRightIcon className="size-6" />
          ) : (
            <PlusIcon className="size-6" />
          ))}
      </Component>
    </Item>
  );
}
