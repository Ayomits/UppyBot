import Link from "next/link";
import { ExternalLinks } from "../const/routes";
import { Logo } from "./logo";

const navigationConfig = [
  {
    name: "Ресурсы",
    links: [
      {
        name: "Документация",
        url: ExternalLinks.Docs,
      },
      {
        name: "TOS",
        url: ExternalLinks.Tos,
      },
      {
        name: "Политика конфедециальности",
        url: ExternalLinks.Privacy,
      },
    ],
  },
  {
    name: "Полезные ссылки",
    links: [
      {
        name: "Сервер поддержки",
        url: ExternalLinks.SupportServer,
      },
      {
        name: "Новости бота",
        url: ExternalLinks.BotTgc,
      },
      {
        name: "Новости разработчиков",
        url: ExternalLinks.DevsTgc,
      },
    ],
  },
];

export function Footer() {
  return (
    <footer className="flex border-t border-foreground/20 justify-center p-10.5 bg-background-secondary min-h-[12.5rem]">
      <div className="flex flex-col gap-4.5 md:flex-row w-full justify-between max-w-[98.5rem]">
        <div className="flex flex-col gap-3.5">
          <Logo withText />
          <span className="text-white-200">&copy; UppyBot</span>
        </div>
        {navigationConfig.map((nav, idx) => (
          <div className="flex flex-col gap-2.5" key={idx}>
            <h3 className="text-xl opacity-60">{nav.name}</h3>
            {nav.links.map((link, idx) => (
              <Link
                className="hover:opacity-80 transition-colors duration-300"
                key={idx}
                href={link.url}
                target="_blank"
              >
                {link.name}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
