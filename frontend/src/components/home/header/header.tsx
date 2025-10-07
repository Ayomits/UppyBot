import { Link } from "react-router";

import { Logo } from "../../layout/logo";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn";
import { Button } from "../../../ui/button";
import { EnterIcon } from "../../../icons/enter.icon";
import { ExternalLinks } from "../../../const/routes";
import { Header, HeaderMain } from "../../layout/header";

function HomeProfile() {
  return (
    <Button variant="secondary">
      <EnterIcon className="size-4" />
      <span>Войти</span>
    </Button>
  );
}

const navigation = [
  {
    name: "Поддержка",
    url: ExternalLinks.SupportServer,
  },
  {
    name: "Документация",
    url: ExternalLinks.Docs,
  },
] as const;

function HomeNavigation({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <nav
      className={cn("flex items-center gap-4 text-sm", className)}
      {...props}
    >
      {navigation.map((item, i) => (
        <Link
          target="_blank"
          className="hover:opacity-80 transition-opacity"
          key={i}
          to={item.url}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}

export function HomeHeader() {
  return (
    <Header>
      <HeaderMain>
        <Logo />
        <HomeNavigation className="hidden md:flex" />
        <HomeProfile />
      </HeaderMain>
    </Header>
  );
}
