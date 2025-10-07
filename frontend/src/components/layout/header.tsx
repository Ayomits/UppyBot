import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Header({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <header
      className={cn("flex items-center h-[6.25rem] bg-bg-200", className)}
      {...props}
    />
  );
}

export function HeaderMain({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex justify-between w-full max-w-[98.125rem] mx-auto items-center px-6",
        className
      )}
      {...props}
    />
  );
}
