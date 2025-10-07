import type { ReactNode } from "react";

import { HomeHeader } from "../components/home/header/header";

export function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col justify-between min-h-svh">
      <div className="flex flex-col gap-[6.25rem]">
        <HomeHeader />
        <main>{children}</main>
      </div>
      <footer>1</footer>
    </div>
  );
}
