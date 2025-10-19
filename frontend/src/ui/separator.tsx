import { cn } from "#/lib/cn";
import type { HTMLAttributes } from "react";

export function Separator({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("self-stretch bg-secondary h-0.5", className)} {...props} />;
}
