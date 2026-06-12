import React, {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "./cn";
import { Icon } from "./icon";

/*
 * Toolbar family — the liquid-glass control strip (SwiftUI Toolbar /
 * ToolbarItem / ControlGroup analog). Deliberately separate from Button:
 * shared appearance comes from the floating-surface tokens, not from a
 * shared component.
 *
 * Density and fit are set once on the Toolbar and cascade via CSS:
 *   density="compact" — bare, dense, muted controls (compact bar setting)
 *   fit="content"     — auto-sized boxes with padded icons (mobile touch)
 */

export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  density?: "compact";
  fit?: "content";
  children: ReactNode;
}

export function Toolbar({
  density,
  fit,
  className,
  children,
  ...rest
}: ToolbarProps): React.JSX.Element {
  return (
    <div
      className={cn("explorer-toolbar", className)}
      data-density={density}
      data-fit={fit}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface ToolbarItemProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: string;
  active?: boolean;
}

/** A standalone glass control (floating surface, circular). */
export const ToolbarItem = forwardRef<HTMLButtonElement, ToolbarItemProps>(
  ({ icon, active, className, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn("explorer-toolbar-item", className)}
      data-active={active || undefined}
      data-surface="floating"
      data-interactive=""
      {...rest}
    >
      <Icon name={icon} />
    </button>
  ),
);
ToolbarItem.displayName = "ToolbarItem";

export interface ToolbarGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** A glass pill grouping several controls (ControlGroup analog). */
export function ToolbarGroup({
  className,
  children,
  ...rest
}: ToolbarGroupProps): React.JSX.Element {
  return (
    <div
      className={cn("explorer-toolbar-group", className)}
      data-surface="floating"
      {...rest}
    >
      {children}
    </div>
  );
}

/** A bare control inside a ToolbarGroup. */
export const ToolbarGroupItem = forwardRef<
  HTMLButtonElement,
  ToolbarItemProps
>(({ icon, active, className, ...rest }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn("explorer-toolbar-group-item", className)}
    data-active={active || undefined}
    {...rest}
  >
    <Icon name={icon} />
  </button>
));
ToolbarGroupItem.displayName = "ToolbarGroupItem";
