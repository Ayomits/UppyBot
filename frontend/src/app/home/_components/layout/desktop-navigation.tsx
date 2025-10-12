import { cn } from "#/lib/cn";
import { Slot } from "@radix-ui/react-slot";
import { type LinkProps, Link } from "react-router";
import { NAVIGATION_ITEMS } from "./const";


interface NavigationItemProps extends Partial<LinkProps> {
  asChild?: boolean;
}

function DesktopNavItem({
  className,
  to = "",
  asChild = false,
  ...props
}: NavigationItemProps) {
  const Component = asChild ? Slot : Link;

  return (
    <Component
      target="_blank"
      to={to}
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
        <DesktopNavItem key={index} to={item.url}>
          {item.name}
        </DesktopNavItem>
      ))}
    </ul>
  );
}