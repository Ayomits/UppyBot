"use client"
import { MiniProfile } from "#/components/auth/profile/profile";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "#/ui/sidebar";
import Image from "next/image";
import { HTMLAttributes } from "react";

export function DashboardSidebar({ ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <Sidebar>
      <SidebarHeader className="gap-2.5 px-6 py-8">
        <Image
          className="object-cover size-16 rounded-lg"
          src="/logo.webp"
          width={64}
          height={64}
          alt="Логотип uppy bot"
        />
        <h2 className="text-2xl">Uppy bot</h2>
      </SidebarHeader>
      <SidebarContent {...props} />
      <SidebarFooter className="w-full px-6 py-4.5">
        <MiniProfile className="w-full" withLogout withUsername />
      </SidebarFooter>
    </Sidebar>
  );
}
