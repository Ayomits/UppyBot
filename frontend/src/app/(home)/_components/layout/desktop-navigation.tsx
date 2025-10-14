import { cn } from "#/lib/cn";
import { Slot } from "@radix-ui/react-slot";
import { NAVIGATION_ITEMS } from "./const";
import Link, { LinkProps } from "next/link";
import { AnchorHTMLAttributes } from "react";

interface NavigationItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  asChild?: boolean;
}

function DesktopNavItem({
  className,
  href = "",
  asChild = false,
  ...props
}: NavigationItemProps) {
  const Component = asChild ? Slot : Link;

  return (
    <Component
      target="_blank"
      href={href}
      className={cn(
        "hover:opacity-80 transition-opacity duration-200",
        className
      )}
      {...props}
    />
  );
}

export function DesktopNavigation() {
  return (
    <ul className="hidden md:flex gap-4">
      {NAVIGATION_ITEMS.map((item, index) => (
        <DesktopNavItem key={index} href={item.url}>
          {item.name}
        </DesktopNavItem>
      ))}
    </ul>
  );
}
