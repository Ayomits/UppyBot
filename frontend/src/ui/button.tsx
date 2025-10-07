import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const buttonVariants = cva("flex items-center gap-1 p-2.5 cursor-pointer rounded-md hover:opacity-80 transition-all", {
  variants: {
    variant: {
      accent: "bg-accent-100",
      secondary: "bg-secondary-100",
    },
  },
  defaultVariants: {
    variant: "secondary",
  },
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
} & VariantProps<typeof buttonVariants>;

export function Button({
  className,
  asChild = false,
  variant,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  );
}
