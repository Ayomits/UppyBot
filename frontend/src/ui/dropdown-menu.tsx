import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "#/lib/cn";
import {
  ControlledValue,
  useControlledValue,
} from "#/hooks/use-controlled-value";
import { Checkbox } from "./checkbox";
import { CareteDownIcon } from "#/icons/carete.icon";

export function DropdownMenu({
  defaultOpen = false,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

export function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}

export function DropdownMenuTrigger({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      className={cn("cursor-pointer", className)}
      {...props}
    />
  );
}

export function DropdownMenuContent({
  className,
  sideOffset = 10,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-lg p-2.5 bg-secondary overflow-x-hidden shadow-md transition-all",
          "data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-0",
          "max-h-[25rem] overflow-y-auto no-scrollbar",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "flex items-center gap-3 rounded-lg cursor-pointer py-3 px-2.5 hover:bg-secondary-hover transition-colors duration-300 data-[highlighted]:border-0 data-[highlighted]:outline-none",
        "disabled:opacity-80",
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuZone({
  className,
  containerClassName,
  placeholder,
  shouldRenderPlaceholder = true,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  containerClassName?: string;
  placeholder?: string;
  shouldRenderPlaceholder?: boolean;
}) {
  return (
    <DropdownMenuTrigger asChild>
      <div
        className={cn(
          "flex items-center justify-between max-w-[25rem] p-2 w-full border rounded-lg",
          containerClassName
        )}
      >
        <div className={cn("flex flex-wrap", className)} {...props}>
          {shouldRenderPlaceholder ? (
            <span className="text-secondary-text">{placeholder}</span>
          ) : (
            children
          )}
        </div>
      </div>
    </DropdownMenuTrigger>
  );
}

export function DropdownMenuCheckbox({
  controlled,
  children,
  setControlled,
  onClick,
  ...props
}: Omit<
  React.ComponentProps<typeof DropdownMenuPrimitive.Item>,
  "defaultValue"
> &
  ControlledValue<boolean>) {
  const [isOpen, setIsOpen] = useControlledValue<boolean>({
    defaultValue: false,
    setter: setControlled,
    value: controlled,
  });

  const handleClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(ev);
    setIsOpen((prev) => !prev);
  };

  return (
    <DropdownMenuItem
      onClick={handleClick}
      onSelect={(e) => e.preventDefault()}
      {...props}
    >
      <Checkbox controlled={isOpen} setControlled={setIsOpen} />
      {children}
    </DropdownMenuItem>
  );
}
