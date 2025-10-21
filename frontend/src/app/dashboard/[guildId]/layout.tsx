import { Fragment, ReactNode } from "react";
import { DashboardSidebar } from "../_components/sidebar";
import { DashboardSettingsNavigation } from "./_components/navigation";
import { DashboardSettingsProvider } from "./_context/settings-context";
import { DashboardSettingsSidebarHeader } from "./_components/header";
import Link from "next/link";
import { AppRoutes } from "#/const/routes";
import { Slot } from "@radix-ui/react-slot";

export default async function DasboardSettingsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;

  return (
    <DashboardSettingsProvider initialValue={{ guildId }}>
      <DashboardSidebar
        header={
          <Link href={AppRoutes.Settings(guildId)}>
            <DashboardSettingsSidebarHeader />
          </Link>
        }
        withServerLink
      >
        <DashboardSettingsNavigation />
      </DashboardSidebar>
      {children}
    </DashboardSettingsProvider>
  );
}
