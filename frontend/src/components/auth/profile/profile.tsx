import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "#/ui/dropdown-menu";
import { Link } from "react-router";
import { useAuth } from "../../../providers/auth";
import { Avatar, AvatarFallback, AvatarImage } from "../../../ui/avatar";

import { AppRoutes } from "#/const/routes";
import { EnterIcon } from "#/icons/enter.icon";
import { UserIcon } from "#/icons/user.icon";
import { cn } from "#/lib/cn";
import type { ComponentProps, HTMLAttributes } from "react";
import { Login } from "../login/login";

export function MiniProfile({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { isAuth, isLoading, user } = useAuth();

  function getComponent() {
    if (isAuth && user) {
      return <AvatarImage src={user.avatar!} />;
    }

    return <AvatarFallback />;
  }

  function getAvatar() {
    return (
      <Avatar className={cn("size-8 md:size-12", className)}>
        {getComponent()}
      </Avatar>
    );
  }

  if (isLoading) {
    return getAvatar();
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)} {...props}>
      {getAvatar()}
      <span className="text-xs md:hidden">
        {user?.global_name ?? user?.username}
      </span>
    </div>
  );
}

export function MiniProfileMenu({
  ...props
}: ComponentProps<typeof DropdownMenuTrigger>) {
  const { isAuth, isLoading, logout } = useAuth();

  if (!isAuth && !isLoading) {
    return <Login {...props} />;
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger {...props}>
        <MiniProfile />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="hidden md:block w-[12rem]">
        <DropdownMenuItem asChild>
          <Link to={AppRoutes.Account}>
            <UserIcon className="size-6" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout}>
          <EnterIcon className="text-error size-6" />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
