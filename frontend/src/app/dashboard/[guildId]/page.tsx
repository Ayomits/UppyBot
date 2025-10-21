"use client";
import { ProfileUsername } from "#/components/auth/profile/profile";
import { AppRoutes } from "#/const/routes";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#/ui/card";
import Link from "next/link";
import { useDasboardSettings } from "./_context/settings-context";
import { Button } from "#/ui/button";

function useSettings(guildId: string) {
  return [
    {
      title: "Общие настройки",
      description: `Раздел, позволяющий вам настроить каналы и роли, используемые ботом во время работы`,
      href: AppRoutes.GeneralSettings(guildId),
    },
    {
      title: "Настройка поинтов",
      description: `Раздел, позволяющий вам настроить систему оценки эффективности ваших сотрудников для каждого мониторинга`,
      href: AppRoutes.PointSettings(guildId),
    },
    {
      title: "Преждевременные напоминания",
      description: `Раздел, позволяющий вам настроить систему преждевременных напоминаний`,
      href: AppRoutes.ForceReminds(guildId),
    },
  ];
}

function SettingsHomeNavigationItem({
  href,
  title,
  description,
}: ReturnType<typeof useSettings>[number]) {
  return (
    <Link href={href} className="cursor-default">
      <Card className="max-w-[25rem] gap-2 p-4">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>{description}</CardDescription>
        </CardContent>
        <CardFooter>
          <Button variant="backgounrd-secondary">Перейти</Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default function SettingsHomePage() {
  const { guildId } = useDasboardSettings((v) => v);

  const settings = useSettings(guildId);

  const mid = Math.floor(settings.length / 2);
  const cols = [settings.slice(0, mid), settings.slice(mid)];

  return (
    <main className="flex flex-col gap-10 w-full px-[8.375rem] py-12.5">
      <div className="flex items-center gap-3 text-3xl">
        <span>Добро пожаловать,</span>
        <ProfileUsername className="bg-gradient-to-r from-accent-text to-background-accent/80 inline-block text-transparent bg-clip-text font-bold" />
      </div>
      <div className="flex flex-col gap-5 w-full">
        <h3 className="text-secondary-text text-xl">Навигация по настройкам</h3>
        <div className="flex gap-2.5">
          {cols.map((item, idx) => (
            <div className="flex flex-col gap-2.5" key={idx}>
              {item.map((item, idx) => (
                <SettingsHomeNavigationItem {...item} key={idx} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
