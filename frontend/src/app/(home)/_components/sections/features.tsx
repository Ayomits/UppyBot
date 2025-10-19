"use client";
import { AlarmIcon } from "#/icons/alarm.icon";
import { ChartIcon } from "#/icons/chart.icon";
import { CogIcon } from "#/icons/cog.icon";
import { cn } from "#/lib/cn";
import { Card, CardContent, CardHeader, CardIcon, CardTitle } from "#/ui/card";
import { useState, type ReactNode } from "react";

type HomeFeature = {
  name: string;
  description: string;
  icon: ReactNode;
};

export function HomeFeatureCard(item: HomeFeature) {
  return (
    <Card
      className={cn(
        "transition-all duration-300 gap-3 w-[22.5rem] h-[15.313rem] p-5",
        "hover:-translate-y-3"
      )}
    >
      <CardHeader className="flex gap-1.5 items-center">
        <CardIcon>{item.icon}</CardIcon>
        <CardTitle className="text-xl">{item.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="max-w-[22.5rem]">{item.description}</p>
      </CardContent>
    </Card>
  );
}

const homeFeatures: HomeFeature[] = [
  {
    name: "Напоминания",
    description:
      "Напоминания о том, что пора прописать команду и продвинуть ваш сервер в топы",
    icon: <AlarmIcon className="size-8" />,
  },
  {
    name: "Статистика",
    description: "Полная история и гибкая аналитика всех ваших команд",
    icon: <ChartIcon className="size-8" />,
  },
  {
    name: "Удобная настройка",
    description: "Всё внутри бота настраивается с помощью удобной веб-панели",
    icon: <CogIcon className="size-8" />,
  },
];

export function HomeFeatures() {
  return (
    <section className="flex items-center flex-col gap-9">
      <h3 className="text-2xl">Бот умеет</h3>
      <div className="flex flex-wrap justify-center gap-8">
        {homeFeatures.map((f, idx) => (
          <HomeFeatureCard {...f} key={idx} />
        ))}
      </div>
    </section>
  );
}
