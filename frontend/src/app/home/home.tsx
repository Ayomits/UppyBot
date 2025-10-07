import { HomeLayout } from "../../layouts/home.layout";
import { HomeHero } from "./hero";

export function Home() {
  return <HomeLayout>
    <HomeHero />
  </HomeLayout>;
}
