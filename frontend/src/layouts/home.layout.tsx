import type { ReactNode } from "react";

import { HomeHeader } from "../components/home/header/header";
import { Footer } from "../components/layout/footer";

export function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[6.25rem] justify-between min-h-svh">
      <div className="flex flex-col gap-[6.25rem]">
        <HomeHeader />
        <main className="flex flex-col gap-[6.25rem]">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
