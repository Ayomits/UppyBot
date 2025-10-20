import type { HTMLAttributes } from "react";
import clsx from "clsx";
import { AppRoutes } from "../const/routes";
import { cn } from "../lib/cn";
import Link from "next/link";
import Image from "next/image";

type LogoProps = HTMLAttributes<HTMLDivElement> & { withText?: boolean };

export function Logo({ className, withText: forceText = false, ...props }: LogoProps) {
  return (
    <Link href={AppRoutes.Home}>
      <div
        className={clsx("flex items-center gap-2.5 text-2xl", className)}
        {...props}
      >
        <Image
          src="/logo.webp"
          alt="Логотип Uppy bot"
          loading="lazy"
          width={64}
          height={64}
        />
        <h3
          className={cn(
            "hidden sm:block hover:opacity-80 transition-opacity",
            forceText && "block"
          )}
        >
          UppyBot
        </h3>
      </div>
    </Link>
  );
}
