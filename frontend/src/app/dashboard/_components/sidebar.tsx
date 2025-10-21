"use client";
import { MiniProfile } from "#/components/auth/profile/profile";
import { AppRoutes } from "#/const/routes";
import { EnterIcon } from "#/icons/enter.icon";
import { Logo } from "#/ui/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "#/ui/sidebar";
import Link from "next/link";
import { Fragment, HTMLAttributes, ReactNode } from "react";

export function DashboardSidebar({
  withServerLink,
  header,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  withServerLink?: boolean;
  header?: ReactNode;
}) {
  return (
    <Sidebar>
      <SidebarHeader className="justify-between w-full px-6 py-8">
        {header ?? (
          <Fragment>
            <Logo withText />
            {/* Опция отвечает за возрат обратно на страницу серверов */}
          </Fragment>
        )}
        {withServerLink && (
          <Link href={AppRoutes.Servers}>
            <EnterIcon className="size-6" />
          </Link>
        )}
      </SidebarHeader>
      <SidebarContent {...props} />
      <SidebarFooter className="w-full px-6 py-4.5">
        <MiniProfile className="w-full" withLogout withUsername />
      </SidebarFooter>
    </Sidebar>
  );
}
