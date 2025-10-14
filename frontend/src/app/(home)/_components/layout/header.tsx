import type { HTMLAttributes } from "react";
import { Header, HeaderMain } from "#/components/layout/header";
import { Logo } from "#/components/layout/logo";
import { cn } from "#/lib/cn";
import dynamic from "next/dynamic";

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
        <MiniProfileMenu className="hidden md:flex items-center gap-4" />
      </HeaderMain>
    </Header>
  );
}
