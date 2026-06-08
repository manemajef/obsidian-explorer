import React from "react";
import { cn } from "../utils/cn";

export type SurfaceVariant =
  | "plain"
  | "item"
  | "card"
  | "container"
  | "floating"
  | "folder";

type SurfaceDomProps = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  | "draggable"
  | "onClick"
  | "onContextMenuCapture"
  | "onDragEnd"
  | "onDragLeaveCapture"
  | "onDragOverCapture"
  | "onDragStart"
  | "onDropCapture"
>;

type SurfaceProps = SurfaceDomProps & {
  variant?: SurfaceVariant;
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function Surface({
  variant = "plain",
  interactive = false,
  selected = false,
  disabled = false,
  className,
  children,
  ...domProps
}: SurfaceProps): React.JSX.Element {
  return (
    <div
      className={cn("ex-surface", className)}
      data-disabled={disabled || undefined}
      data-interactive={interactive || undefined}
      data-selected={selected || undefined}
      data-variant={variant}
      aria-disabled={disabled || undefined}
      {...domProps}
    >
      {children}
    </div>
  );
}
