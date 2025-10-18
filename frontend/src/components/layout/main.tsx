import type { HTMLAttributes } from "react";
import { HEADER_MARGIN } from "./header";
import { cn } from "#/lib/cn";

export function AppMain({
  withHeader,
  className,
  ...props
}: { withHeader: boolean } & HTMLAttributes<HTMLDivElement>) {
  return (
    <main
      style={{
        marginTop: withHeader ? HEADER_MARGIN : 0,
        ...props.style,
      }}
      className={cn("max-w-[var(--max-app-width)] mx-auto", className)}
      {...props}
    />
  );
}
