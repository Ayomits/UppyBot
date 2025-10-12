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
import { Link } from "react-router";
import { Fragment } from "react/jsx-runtime";
import { NAVIGATION_ITEMS } from "./const";
import { Separator } from "#/ui/separator";

function MobileNavItem({
  className,
  children,
  disabled,
  ...props
}: HTMLAttributes<HTMLDivElement> & { disabled?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center px-6 py-4",
        "bg-bg-200 active:bg-secondary-100 transition-colors",
        disabled && "bg-secondary-100/85",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function MobileNavigationList() {
  const { isAuth, logout } = useAuth();

  const discordLoginHandler = useDiscordLogin();

  return (
    <ul className="relative flex flex-col w-full bg-background">
      {NAVIGATION_ITEMS.map((item, index) => (
        <MobileNavItem key={index}>
          <Link
            className="flex justify-between items-center w-full"
            to={item.url}
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
          <Link to={AppRoutes.Account}>
            <MobileNavItem className="justify-between">
              <MiniProfile />
            </MobileNavItem>
          </Link>
          <MobileNavItem className="justify-between" onClick={logout}>
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
