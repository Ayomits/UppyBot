"use client";

import { AppRoutes } from "#/const/routes";
import { useAuth } from "#/providers/auth";
import { SIDEBAR_WIDTH, SidebarProvider } from "#/ui/sidebar";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuth } = useAuth();

  if (!isAuth) {
    return redirect(AppRoutes.Home);
  }

  return (
    <SidebarProvider>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${SIDEBAR_WIDTH} 1fr`,
        }}
      >
        {children}
      </div>
    </SidebarProvider>
  );
}
