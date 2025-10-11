import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Fragment, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  "flex items-center gap-1 p-2.5 cursor-pointer rounded-md hover:opacity-80 transition-all disabled:cursor-not-allowed disabled:opacity-80",
  {
    variants: {
      variant: {
        accent: "bg-accent-100",
        secondary: "bg-secondary-100",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  useNativeStyles?: boolean;
  loading?: boolean;
} & VariantProps<typeof buttonVariants>;

export function Button({
  className,
  asChild = false,
  useNativeStyles = true,
  loading = false,
  disabled,
  children,
  variant,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";

  function getLoadingContent() {
    return (
      <Fragment>
        <Spinner className="size-5" />
        {children}
      </Fragment>
    );
  }

  return (
    <Component
      disabled={disabled || loading}
      className={cn(useNativeStyles && buttonVariants({ variant }), className)}
      {...props}
    >
      {loading ? getLoadingContent() : children}
    </Component>
  );
}
