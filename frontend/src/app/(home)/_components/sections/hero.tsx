"use client";
import { Login } from "#/components/auth/login/login";
import { AppRoutes, ExternalLinks } from "#/const/routes";
import { EnterIcon } from "#/icons/enter.icon";
import { InviteIcon } from "#/icons/invite.icon";
import { useAuth } from "#/providers/auth";
import { Button } from "#/ui/button";
import Link from "next/link";

export function HomeHero() {
  const { isAuth } = useAuth();

  return (
    <section className="flex items-center justify-center gap-42 text-center px-6">
      <div className="flex flex-col items-center gap-6">
        <div className="text-xl md:text-2xl font-bold">
          <p>
            Продвигайте ваш <span className="text-accent-text">Discord</span>{" "}
            эффективно
          </p>
          <p>
            Вместе с <span className="text-accent-text">Uppy</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="accent" asChild>
            <Link href={ExternalLinks.InviteBot} target="_blank">
              <InviteIcon className="size-6" />
              Пригласить
            </Link>
          </Button>
          {isAuth ? (
            <Button asChild>
              <Link href={AppRoutes.Servers}>
                <EnterIcon className="size-6" />
                Мои серверы
              </Link>
            </Button>
          ) : (
            <Login />
          )}
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
