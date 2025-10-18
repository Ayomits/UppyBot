import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export const HEADER_HEIGHT = `6.25rem`;
export const HEADER_MARGIN = `12.5rem`;

export function Header({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <header
      style={{
        height: HEADER_HEIGHT,
      }}
      className={cn(
        "fixed z-40 shadow w-full flex items-center bg-bg-200",
        className
      )}
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
        "flex justify-between w-full max-w-[var(--max-app-width)] mx-auto items-center px-6",
        className
      )}
      {...props}
    />
  );
}
