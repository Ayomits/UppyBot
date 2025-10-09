import { HomeLayout } from "../../layouts/home.layout";
import { HomeFeatures } from "./_components/features";
import { HomeHero } from "./_components/hero";
import { HomeInvitation } from "./_components/invitation";
import { HomeTrusted } from "./_components/trusted";

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
