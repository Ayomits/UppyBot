import type { HTMLAttributes } from "react";
import { Header, HeaderMain } from "#/ui/header";
import { Logo } from "#/ui/logo";
import { cn } from "#/lib/cn";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "#/ui/button";
import { ExternalLinks } from "#/const/routes";
import { EnterIcon } from "#/icons/enter.icon";

const MobileNavigation = dynamic(() =>
  import("./mobile-navigation").then((m) => m.MobileNavigation)
);
const DesktopNavigation = dynamic(() =>
  import("./desktop-navigation").then((m) => m.DesktopNavigation)
);
const MiniProfileMenu = dynamic(() =>
  import("#/components/auth/profile/profile").then((m) => m.MiniProfileMenu)
);

function Navigation({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <nav className={cn("flex items-center gap-4", className)} {...props}>
      <DesktopNavigation />
      <MobileNavigation />
    </nav>
  );
}

export function HomeHeader() {
  return (
    <Header>
      <HeaderMain>
        <Logo />
        <Navigation />
        <Button className="hidden md:flex" asChild>
          <Link href={ExternalLinks.SupportServer}>
            <EnterIcon className="size-6" />
            Сервер поддержки
          </Link>
        </Button>
      </HeaderMain>
    </Header>
  );
}
