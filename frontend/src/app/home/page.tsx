import { HomeLayout } from "../../layouts/home.layout";
import { HomeFeatures } from "./_components/sections/features";
import { HomeHero } from "./_components/sections/hero";
import { HomeInvitation } from "./_components/sections/invitation";
import { HomeTrusted } from "./_components/sections/trusted";

export function Home() {
  return (
    <HomeLayout>
      <HomeHero />
      <HomeFeatures />
      <HomeTrusted />
      <HomeInvitation />
    </HomeLayout>
  );
}
