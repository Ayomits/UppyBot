import { useState, type ReactNode } from "react";
import { EnterIcon } from "../../../icons/enter.icon";
import { ChartIcon } from "../../../icons/chart.icon";
import { CogIcon } from "../../../icons/cog.icon";
import { cn } from "../../../lib/cn";

type HomeFeature = {
  name: string;
  description: string;
  icon: ReactNode;
};

export function HomeFeatureCard(item: HomeFeature) {
  const [shouldFill, setShouldFill] = useState(false);

  return (
    <div
      onMouseEnter={() => setShouldFill(true)}
      onMouseLeave={() => setShouldFill(false)}
      className={cn(
        "flex transition-all duration-300 border border-accent-200/10 bg-secondary-100 rounded-xl flex-col gap-3 w-[22.5rem] h-[15.313rem] p-5",
        shouldFill && "-translate-y-4"
      )}
    >
      <div className="flex gap-1.5 items-center">
        <div
          className={cn(
            "flex bg-bg-200 size-16 justify-center rounded-3xl text-white items-center transition-all duration-300",
            shouldFill && "bg-accent-200/80 rotate-12"
          )}
        >
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
