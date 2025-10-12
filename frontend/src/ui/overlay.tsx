import { cn } from "#/lib/cn";
import type { HTMLAttributes } from "react";

export function Overlay({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div
    className={cn(
      "absolute inset-0 bg-background/80 backdrop-blur-sm",
      className
    )}
    {...props}
  />;
}
