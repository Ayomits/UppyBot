import type { ReactNode } from "react";

import { HomeHeader } from "../app/home/_components/header";
import { Footer } from "../components/layout/footer";
import { AppMain } from "../components/layout/main";

export function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[6.25rem] justify-between min-h-svh">
      <div className="flex flex-col gap-[6.25rem]">
        <HomeHeader />
        <AppMain withHeader className="flex flex-col gap-[6.25rem]">
          {children}
        </AppMain>
      </div>
      <Footer />
    </div>
  );
}
