import { Fragment, ReactNode } from "react";
import { DashboardSidebar } from "../_components/sidebar";
import { DashboardSettingsNavigation } from "./_components/navigation";
import { DashboardSettingsProvider } from "./_context/settings-context";
import { DashboardSettingsHeader } from "./_components/header";

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
      <DashboardSidebar header={<DashboardSettingsHeader />} withServerLink>
        <DashboardSettingsNavigation />
      </DashboardSidebar>
      {children}
    </DashboardSettingsProvider>
  );
}
