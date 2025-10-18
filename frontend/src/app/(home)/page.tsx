import { Fragment } from "react";
import dynamic from "next/dynamic";

const HomeHero = dynamic(() =>
  import("#/app/(home)/_components/sections/hero").then((m) => m.HomeHero)
);
const HomeFeatures = dynamic(() =>
  import("#/app/(home)/_components/sections/features").then(
    (m) => m.HomeFeatures
  )
);
const HomeStats = dynamic(() =>
  import("#/app/(home)/_components/sections/stats").then((m) => m.HomeStats)
);
const HomeInvitation = dynamic(() =>
  import("#/app/(home)/_components/sections/invitation").then(
    (m) => m.HomeInvitation
  )
);

export default function Home() {
  return (
    <Fragment>
      <HomeHero />
      <HomeFeatures />
      <HomeStats />
      <HomeInvitation />
    </Fragment>
  );
}
