import dynamic from "next/dynamic";

const HomeHero = dynamic(() =>
  import("#/app/(home)/_components/sections/hero").then((m) => m.HomeHero)
);
const HomeFeatures = dynamic(() =>
  import("#/app/(home)/_components/sections/features").then(
    (m) => m.HomeFeatures
  )
);
const HomeInvitation = dynamic(() =>
  import("#/app/(home)/_components/sections/invitation").then(
    (m) => m.HomeInvitation
  )
);

export default async function Home() {
  return (
    <>
      <HomeHero />
      <HomeFeatures />
      <HomeInvitation />
    </>
  );
}
