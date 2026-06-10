import React, {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "./cn";
import { Icon } from "./icon";

export type ButtonVariant = "glass" | "ghost";
export type ButtonShape = "circle" | "pill" | "round";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon?: string;
  variant?: ButtonVariant;
  shape?: ButtonShape;
  /** content: auto-sized box with padded icon (mobile touch targets). */
  fit?: "content";
  density?: "compact";
  active?: boolean;
  selected?: boolean;
  /** glass only: disables the hover lift/scale (e.g. exhausted load-more). */
  interactive?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      icon,
      variant = "ghost",
      shape = "circle",
      fit,
      density,
      active,
      selected,
      interactive,
      className,
      children,
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      type="button"
      className={cn("explorer-button", className)}
      data-variant={variant}
      data-shape={shape}
      data-fit={fit}
      data-density={density}
      data-active={active || undefined}
      data-selected={selected || undefined}
      data-surface={variant === "glass" ? "floating" : undefined}
      data-interactive={
        (variant === "glass" && interactive !== false) || undefined
      }
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** false renders a bare group (compact bar mode). */
  surface?: boolean;
  fit?: "content";
  density?: "compact";
  children: ReactNode;
}

export function ButtonGroup({
  surface = true,
  fit,
  density,
  className,
  children,
  ...rest
}: ButtonGroupProps): React.JSX.Element {
  return (
    <div
      className={cn("explorer-button-group", className)}
      data-surface={surface ? "floating" : undefined}
      data-fit={fit}
      data-density={density}
      {...rest}
    >
      {children}
    </div>
  );
}
