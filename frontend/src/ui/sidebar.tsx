"use client"
import { useMediaQuery } from "#/hooks/use-media-query";
import {
  Dispatch,
  HTMLAttributes,
  ReactNode,
  SetStateAction,
  useCallback,
  useState,
} from "react";
import { Sheet, SheetContent } from "./sheet";
import { createContext } from "#/lib/create-context";
import { cn } from "#/lib/cn";

export const SIDEBAR_WIDTH = `21.875rem`;

const sidebarCtx = createContext<{
  isOpen: boolean;
  toggle: () => void;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}>();

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((v) => !v), [setIsOpen]);

  return (
    <sidebarCtx.Provider initialValue={{ isOpen, toggle, setIsOpen }}>
      {children}
    </sidebarCtx.Provider>
  );
}

export function Sidebar({
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const { isOpen, setIsOpen } = sidebarCtx.useSelect((v) => v);

  if (isMobile) {
    return (
      <Sheet open={isOpen && isMobile} onOpenChange={setIsOpen}>
        <SheetContent side="left" {...props} />
      </Sheet>
    );
  }

  return (
    <aside
      className="relative h-svh flex-col hidden md:flex ring-[0.2px] z-50 left-0 bg-background-secondary"
      style={{ width: SIDEBAR_WIDTH, ...style }}
      {...props}
    />
  );
}

export function SidebarContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col h-full justify-between overflow-y-auto no-scrollbar",
        className
      )}
      {...props}
    />
  );
}

export function SidebarGroup({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("flex flex-col", className)} {...props} />;
}

export function SidebarHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <header
      className={cn(
        "flex items-center min-h-[8rem] border-b border-foreground/20",
        className
      )}
      {...props}
    />
  );
}

export function SidebarFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <footer
      className={cn(
        "flex justify-between min-h-[6.25rem] border-t border-foreground/20",
        className
      )}
      {...props}
    />
  );
}
