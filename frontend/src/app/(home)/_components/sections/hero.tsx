import { Login } from "#/components/auth/login/login";
import { ExternalLinks } from "#/const/routes";
import { InviteIcon } from "#/icons/invite.icon";
import { Button } from "#/ui/button";
import Link from "next/link";

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
            <Link href={ExternalLinks.InviteBot} target="_blank">
              <InviteIcon className="size-6" />
              Пригласить
            </Link>
          </Button>
          <Login />
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
