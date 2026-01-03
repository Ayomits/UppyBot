import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Sidebar({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <aside
      className={cn("flex flex-col w-87.5 h-full", className)}
      {...props}
    />
  );
}

export function SidebarHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <header
      className={cn("flex items-center px-4 py-6", className)}
      {...props}
    />
  );
}

export function SidebarMain({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <main className={cn("px-4 py-6", className)} {...props} />;
}
