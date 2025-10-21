"use client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "#/ui/dropdown-menu";
import { useAuth } from "../../../providers/auth";
import { Avatar, AvatarFallback, AvatarImage } from "../../../ui/avatar";

import { AppRoutes } from "#/const/routes";
import { EnterIcon } from "#/icons/enter.icon";
import { UserIcon } from "#/icons/user.icon";
import { cn } from "#/lib/cn";
import type { ComponentProps, HTMLAttributes } from "react";
import { Login } from "../login/login";
import Link from "next/link";
import { Logout } from "../logout/logout";
import { Skeleton } from "#/ui/skeleton";

type MiniProfileFlags = {
  withUsername?: boolean;
  withLogout?: boolean;
  withAvatar?: boolean;
};

export function MiniProfile({
  className,
  withAvatar = true,
  withLogout,
  withUsername,
  ...props
}: HTMLAttributes<HTMLDivElement> & MiniProfileFlags) {
  return (
    <div
      className={cn(
        "flex items-center justify-between text-sm md:text-base",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5">
        {withAvatar && <ProfileAvatar />}
        {withUsername && <ProfileUsername className="text-sm md:text-base" />}
      </div>
      {withLogout && <Logout />}
    </div>
  );
}

export function ProfileUsername({
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  const { isLoading, user } = useAuth();
  if (isLoading) {
    return <Skeleton className="bg-secondary w-12 h-4" />;
  }

  return (
    <span {...props}>
      {children}
      {user?.global_name ?? user?.username}
    </span>
  );
}

export function ProfileAvatar({
  className,
  ...props
}: ComponentProps<typeof Avatar>) {
  const { user } = useAuth();

  function getComponent() {
    if (user) {
      return <AvatarImage src={user.avatar!} />;
    }

    return <AvatarFallback />;
  }

  return (
    <Avatar className={cn("size-8 md:size-12", className)} {...props}>
      {getComponent()}
    </Avatar>
  );
}

export function MiniProfileMenu({
  withLogout,
  withUsername,
  ...props
}: ComponentProps<typeof DropdownMenuTrigger> & MiniProfileFlags) {
  const { isAuth, isLoading, logout } = useAuth();

  if (!isAuth && !isLoading) {
    return <Login {...props} />;
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger disabled={isLoading} {...props} asChild>
        <MiniProfile withLogout={withLogout} withUsername={withUsername} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="hidden md:block w-[12rem]">
        <DropdownMenuItem asChild>
          <Link href={AppRoutes.Servers}>
            <UserIcon className="size-6" />
            Мои серверы
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => logout()}>
          <EnterIcon className="text-error size-6" />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
