import { HomeLayout } from "../../layouts/home.layout";
import { HomeFeatures } from "./features";
import { HomeHero } from "./hero";
import { HomeInvitation } from "./invitation";
import { HomeTrusted } from "./trusted";

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
