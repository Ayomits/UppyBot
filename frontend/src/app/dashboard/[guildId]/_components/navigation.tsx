"use client";
import { AppRoutes } from "#/const/routes";
import { AlarmIcon } from "#/icons/alarm.icon";
import { cn } from "#/lib/cn";
import { Item } from "#/ui/item";
import Link, { LinkProps } from "next/link";
import { HTMLAttributes } from "react";
import { useDasboardSettings } from "../_context/settings-context";

const useNavigationItems = (guildId: string) => {
  return [
    {
      name: "Настройка",
      items: [
        {
          name: "Система поинтов",
          url: AppRoutes.PointSettings(guildId),
          icon: <AlarmIcon className="size-6" />,
        },
      ],
    },
  ];
};

export function DashboardSettingsNavigation() {
  const { guildId } = useDasboardSettings((v) => ({ guildId: v.guildId }));
  const items = useNavigationItems(guildId);
  return (
    <nav className="pt-6.5">
      {items.map((item, idx) => (
        <SettingsNavigationGroup key={idx}>
          <h3 className="px-2 text-secondary-text">{item.name}</h3>
          {item.items.map((item, idx) => (
            <SettingsNavigationItem key={idx} href={item.url}>
              {item.icon}
              {item.name}
            </SettingsNavigationItem>
          ))}
        </SettingsNavigationGroup>
      ))}
    </nav>
  );
}

export function SettingsNavigationGroup({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col", className)} {...props} />;
}

export function SettingsNavigationItem({
  className,
  ...props
}: LinkProps & HTMLAttributes<HTMLAnchorElement>) {
  return (
    <Item asChild className={cn("p-2 gap-2.5", className)}>
      <Link {...props} />
    </Item>
  );
}
