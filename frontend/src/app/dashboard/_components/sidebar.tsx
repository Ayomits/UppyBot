"use client";
import { MiniProfile } from "#/components/auth/profile/profile";
import { AppRoutes } from "#/const/routes";
import { Logo } from "#/ui/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "#/ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { HTMLAttributes } from "react";

export function DashboardSidebar({ ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <Sidebar>
      <SidebarHeader className="px-6 py-8">
        <Logo withText />
      </SidebarHeader>
      <SidebarContent {...props} />
      <SidebarFooter className="w-full px-6 py-4.5">
        <MiniProfile className="w-full" withLogout withUsername />
      </SidebarFooter>
    </Sidebar>
  );
}
