"use client";
import { useDiscordLogin } from "#/components/auth/login/use-discord-login";
import { MiniProfile } from "#/components/auth/profile/profile";
import { AppRoutes } from "#/const/routes";
import { BurgerIcon } from "#/icons/burger.icon";
import { CareteRightIcon } from "#/icons/carete.icon";
import { EnterIcon } from "#/icons/enter.icon";
import { cn } from "#/lib/cn";
import { useAuth } from "#/providers/auth";
import { Button } from "#/ui/button";
import { Overlay } from "#/ui/overlay";
import { type HTMLAttributes, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { NAVIGATION_ITEMS } from "./const";
import { Separator } from "#/ui/separator";
import { Slot } from "@radix-ui/react-slot";
import Link from "next/link";

function MobileNavItem({
  className,
  children,
  asChild,
  ...props
}: HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "div";
  return (
    <Component
      className={cn(
        "flex items-center px-6 py-4",
        "bg-background-secondary active:bg-secondary transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

function MobileNavigationList() {
  const { isAuth, logout } = useAuth();

  const discordLoginHandler = useDiscordLogin();

  return (
    <ul className="relative flex flex-col w-full bg-background">
      {NAVIGATION_ITEMS.map((item, index) => (
        <MobileNavItem key={index} asChild>
          <Link
            className="flex justify-between items-center w-full"
            href={item.url}
            target="_blank"
          >
            <span>{item.name}</span>
            <CareteRightIcon className="size-4" />
          </Link>
        </MobileNavItem>
      ))}
      <Separator />

      {isAuth && (
        <Fragment>
          <MobileNavItem className="justify-between" asChild>
            <Link href={AppRoutes.Servers}>
              <MiniProfile />
            </Link>
          </MobileNavItem>

          <MobileNavItem className="justify-between" onClick={() => logout()}>
            Выйти
            <EnterIcon className="text-error size-4" />
          </MobileNavItem>
        </Fragment>
      )}

      {!isAuth && (
        <MobileNavItem
          className="justify-between"
          onClick={() => discordLoginHandler.handle()}
        >
          Войти
          <EnterIcon className="size-4" />
        </MobileNavItem>
      )}
    </ul>
  );
}

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => setIsOpen((prev) => !prev);

  return (
    <Fragment>
      <Button
        className="md:hidden"
        onClick={handleToggle}
        aria-label="Открыть меню"
      >
        <BurgerIcon className="size-6" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 top-[6.25rem] z-50 md:hidden">
          <Overlay />
          <MobileNavigationList />
        </div>
      )}
    </Fragment>
  );
}
