import { Link } from "react-router";
import { Button } from "../../../../ui/button";
import { ExternalLinks } from "../../../../const/routes";
import { ChatIcon } from "../../../../icons/chat.icon";
import { InviteIcon } from "../../../../icons/invite.icon";

export function HomeHero() {
  return (
    <section className="flex items-center justify-center gap-42 text-center px-6">
      <div className="flex flex-col items-center gap-6">
        <div className="text-xl md:text-2xl">
          <p>
            Продвигайте ваш <span className="text-accent-200">Discord</span>{" "}
            эффективно
          </p>
          <p>
            Вместе с <span className="text-accent-200">Uppy</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="accent" asChild>
            <Link to={ExternalLinks.InviteBot} target="_blank">
              <InviteIcon className="size-6" />
              Пригласить
            </Link>
          </Button>
          <Button asChild>
            {/* TODO: Login button */}
            <Link to={ExternalLinks.SupportServer} target="_blank">
              <ChatIcon className="size-6" />
              Сервер поддержки
            </Link>
          </Button>
        </div>
      </div>
      <img
        className="hidden lg:block"
        height={350}
        width={350}
        src="/logo.webp"
        alt="Логотип"
      />
    </section>
  );
}
