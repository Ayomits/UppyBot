import { Link } from "react-router";
import { ExternalLinks } from "../../const/routes";
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
        name: "Новостной телеграм",
        url: ExternalLinks.Tgc,
      },
    ],
  },
];

export function Footer() {
  return (
    <footer className="flex justify-center p-10.5 bg-bg-200 min-h-[12.5rem]">
      <div className="flex flex-col gap-4.5 md:flex-row w-full justify-between max-w-[98.5rem]">
        <div className="flex flex-col gap-3.5">
          <Logo forceText />
          <span className="text-white-200">&copy; UppyBot</span>
        </div>
        {navigationConfig.map((nav, idx) => (
          <div className="flex flex-col gap-2.5" key={idx}>
            <h3 className="text-xl">{nav.name}</h3>
            {nav.links.map((link, idx) => (
              <Link key={idx} to={link.url} target="_blank">
                {link.name}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
