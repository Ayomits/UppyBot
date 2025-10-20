import { cn } from "#/lib/cn";
import { Slot } from "@radix-ui/react-slot";
import { HTMLAttributes } from "react";

export function Item({
  className,
  asChild,
  ...props
}: HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "div";
  return (
    <Component className={cn("flex justify-between", className)} {...props} />
  );
}
