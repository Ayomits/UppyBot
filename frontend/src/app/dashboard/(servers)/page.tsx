import { Fragment } from "react";
import { DashboardSidebar } from "../_components/sidebar";
import { DiscordGuildList } from "./_components/guilds";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Мои серверы | Uppy Bot",
  description: "Страница моих серверов",
  robots: null,
};

export default function DasboardServersPage() {
  return (
    <Fragment>
      <DashboardSidebar>
        <DiscordGuildList />
      </DashboardSidebar>
      <main className="flex justify-center items-center text-2xl">
        Начните с выбора сервера
      </main>
    </Fragment>
  );
}
