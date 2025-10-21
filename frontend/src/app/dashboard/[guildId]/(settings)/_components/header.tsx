import { cn } from "#/lib/cn";
import { HTMLAttributes } from "react";

export function DashboardSettingsHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("h-[8rem] w-full mx-auto text-2xl", className)} {...props} />
  );
}
