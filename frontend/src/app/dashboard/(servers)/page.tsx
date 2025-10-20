import { Fragment } from "react";
import { DashboardSidebar } from "../_components/sidebar";
import { AppMain } from "#/ui/main";

export default function DasboardServersPage() {
  return (
    <Fragment>
      <DashboardSidebar />
      <div className="flex justify-center items-center text-2xl">
        Начните с выбора сервера
      </div>
    </Fragment>
  );
}
