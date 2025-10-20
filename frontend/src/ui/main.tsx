import type { HTMLAttributes } from "react";
import { HEADER_MARGIN } from "./header";
import { cn } from "#/lib/cn";
import { SIDEBAR_WIDTH } from "./sidebar";

export function AppMain({
  withHeader = false,
  withSidebar = false,
  className,
  ...props
}: Partial<{
  withHeader: boolean;
  withSidebar: boolean;
}> &
  HTMLAttributes<HTMLDivElement>) {
  return (
    <main
      style={{
        marginTop: withHeader ? HEADER_MARGIN : 0,
        marginLeft: withSidebar ? SIDEBAR_WIDTH : 0,
        ...props.style,
      }}
      className={cn("max-w-[var(--max-app-width)] mx-auto", className)}
      {...props}
    />
  );
}
