import { Link, type LinkProps } from "react-router";

import { Logo } from "../../../components/layout/logo";
import { Fragment, useState, type HTMLAttributes } from "react";
import { cn } from "../../../lib/cn";
import { Button, type ButtonProps } from "../../../ui/button";
import { ExternalLinks } from "../../../const/routes";
import { Header, HeaderMain } from "../../../components/layout/header";
import { BurgerIcon } from "../../../icons/burger.icon";
import { CareteRightIcon } from "../../../icons/carete.icon";
import { Login } from "../../../components/auth/login";

function HomeProfile({ ...props }: ButtonProps) {
  return <Login />;
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

function DesktopHomeNavigationItem({
  name,
  url,
  className,
  ...props
}: (typeof navigation)[number] & Omit<LinkProps, "to">) {
  return (
    <Link
      target="_blank"
      to={url}
      className={cn("hover:opacity-80 transition-opacity", className)}
      {...props}
    >
      {name}
    </Link>
  );
}

function DesktopNavigationList() {
  return (
    <ul className="hidden md:flex gap-4">
      {navigation.map((item, i) => (
        <DesktopHomeNavigationItem key={i} {...item} />
      ))}
    </ul>
  );
}

function MobileNavigationItem({
  name,
  url,
  className,
  ...props
}: (typeof navigation)[number] & Omit<LinkProps, "to">) {
  return (
    <Link
      target="_blank"
      to={url}
      className={cn(
        "flex justify-between px-6 py-4 bg-bg-200 active:bg-secondary-100 transition-colors",
        className
      )}
      {...props}
    >
      {name}
      <CareteRightIcon className="size-4" />
    </Link>
  );
}

function MobileNavigationList() {
  const [open, setOpen] = useState(false);

  return (
    <Fragment>
      <Button
        className="md:hidden"
        onClick={() => setOpen((prev) => !prev)}
        useNativeStyles={false}
      >
        <BurgerIcon className="size-8" />
      </Button>
      {open && (
        <ul className="flex md:hidden flex-col w-full absolute left-0 top-[100px]">
          {navigation.map((item, idx) => (
            <MobileNavigationItem {...item} key={idx} />
          ))}
        </ul>
      )}
    </Fragment>
  );
}

function Navigation({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <nav
      className={cn("flex items-center gap-4 text-sm", className)}
      {...props}
    >
      <DesktopNavigationList />
      <MobileNavigationList />
    </nav>
  );
}

export function HomeHeader() {
  return (
    <Header>
      <HeaderMain>
        <Logo />
        <Navigation />
        <HomeProfile className="hidden md:flex" />
      </HeaderMain>
    </Header>
  );
}
