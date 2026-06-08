import React from "react";
import { cn } from "../utils/cn";

type ButtonGroupProps = {
  variant?: "ghost" | "soft" | "raised";
  gap?: "none" | "sm" | "md" | "auto";
  children: React.ReactNode;
  className?: string;
};

export function ButtonGroup({
  variant = "ghost",
  gap = "sm",
  children,
  className,
}: ButtonGroupProps): React.JSX.Element {
  return (
    <div className={cn("ex-button-group", className)} data-gap={gap} data-variant={variant}>
      {children}
    </div>
  );
}
