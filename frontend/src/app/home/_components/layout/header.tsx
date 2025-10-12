import { Logo } from "../../../../components/layout/logo";
import { cn } from "../../../../lib/cn";
import { Header, HeaderMain } from "../../../../components/layout/header";
import { MiniProfileMenu } from "../../../../components/auth/profile/profile";
import { MobileNavigation } from "./mobile-navigation";
import type { HTMLAttributes } from "react";
import { DesktopNavigation } from "./desktop-navigation";

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
