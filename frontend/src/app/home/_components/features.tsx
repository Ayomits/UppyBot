import type { ReactNode } from "react";
import { EnterIcon } from "../../../icons/enter.icon";
import { ChartIcon } from "../../../icons/chart.icon";
import { CogIcon } from "../../../icons/cog.icon";

type HomeFeature = {
  name: string;
  description: string;
  icon: ReactNode;
};

export function HomeFeatureCard(item: HomeFeature) {
  return (
    <div className="flex bg-secondary-100 rounded-xl flex-col gap-3 w-[22.5rem] h-[15.313rem] p-5">
      <div className="flex gap-1.5 items-center">
        <div className="flex bg-bg-200 size-16 justify-center rounded-3xl text-white items-center">
          {item.icon}
        </div>
        <h3 className="text-xl">{item.name}</h3>
      </div>
      <p className="max-w-[22.5rem]">{item.description}</p>
    </div>
  );
}

const homeFeatures: HomeFeature[] = [
  {
    name: "Напоминания",
    description:
      "Напоминания о том, что пора прописать команду и продвинуть ваш сервер в топы",
    icon: <EnterIcon className="size-8" />,
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
    <section className="flex flex-wrap justify-center gap-8">
      {homeFeatures.map((f, idx) => (
        <HomeFeatureCard {...f} key={idx} />
      ))}
    </section>
  );
}
