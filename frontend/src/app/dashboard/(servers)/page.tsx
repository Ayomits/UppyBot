import { Fragment } from "react";
import { DashboardSidebar } from "../_components/sidebar";
import { DiscordGuildList } from "./_components/guilds";

export default function DasboardServersPage() {
  return (
    <Fragment>
      <DashboardSidebar>
        <DiscordGuildList />
      </DashboardSidebar>
      <div className="flex justify-center items-center text-2xl">
        Начните с выбора сервера
      </div>
    </Fragment>
  );
}
