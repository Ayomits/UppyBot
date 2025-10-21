import { cva, VariantProps } from "class-variance-authority";
import { forwardRef, HTMLAttributes, MouseEvent } from "react";
import {
  ControlledValue,
  useControlledValue,
} from "../hooks/use-controlled-value";
import { CheckIcon } from "#/icons/check.icon";
import { cn } from "#/lib/cn";

interface CheckboxProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof checkboxVariants>,
    ControlledValue<boolean> {}

const checkboxVariants = cva(
  "flex size-[20px] items-center justify-center rounded",
  {
    variants: {
      variant: {
        default:
          "border border-foreground hover:border-primary data-[checked=true]:border-none data-[checked=true]:bg-background-accent data-[checked=true]:text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const Checkbox = forwardRef<HTMLDivElement, CheckboxProps>(
  (
    { variant, className, onClick, controlled, setControlled, ...props },
    ref
  ) => {
    const [isChecked, setIsChecked] = useControlledValue({
      defaultValue: false,
      value: controlled,
      setter: setControlled,
    });

    const handleClick = (ev: MouseEvent<HTMLDivElement>) => {
      onClick?.(ev);
      setIsChecked(!isChecked);
    };

    return (
      <div
        ref={ref}
        data-checked={isChecked}
        onClick={handleClick}
        className={cn(
          checkboxVariants({ variant }),
          "transition-colors duration-100",
          className
        )}
        {...props}
      >
        <CheckIcon className={cn(isChecked ? "opacity-100" : "opacity-0")} />
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
