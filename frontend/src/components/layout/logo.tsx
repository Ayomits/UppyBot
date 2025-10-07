import type { HTMLAttributes } from "react";
import clsx from "clsx";
import { Link } from "react-router";
import { AppRoutes } from "../../const/routes";
import { cn } from "../../lib/cn";

type LogoProps = HTMLAttributes<HTMLDivElement> & { forceText?: boolean };

export function Logo({ className, forceText = false, ...props }: LogoProps) {
  return (
    <Link to={AppRoutes.Home}>
      <div
        className={clsx("flex items-center gap-2.5 text-2xl", className)}
        {...props}
      >
        <img
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
