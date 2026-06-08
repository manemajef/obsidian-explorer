import React from "react";
import { cn } from "../utils/cn";
import { Icon } from "./Icon";

type ButtonProps = {
  variant?: "ghost" | "soft" | "raised" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: string;
  label?: string;
  active?: boolean;
  disabled?: boolean;
  shape?: "default" | "circle";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
} & Pick<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  | "draggable"
  | "onDragEnd"
  | "onDragLeaveCapture"
  | "onDragOverCapture"
  | "onDragStart"
  | "onDropCapture"
>;

export function Button({
  variant = "ghost",
  size = "md",
  icon,
  label,
  active = false,
  disabled = false,
  shape = "default",
  onClick,
  className,
  ...domProps
}: ButtonProps): React.JSX.Element {
  return (
    <button
      className={cn("clickable-icon", "ex-button", className)}
      data-active={active || undefined}
      data-shape={shape}
      data-size={size}
      data-variant={variant}
      disabled={disabled}
      onClick={onClick}
      title={icon && !label ? icon : undefined}
      type="button"
      {...domProps}
    >
      {icon && <Icon name={icon} size={size === "lg" ? "lg" : size === "md" ? "md" : "sm"} />}
      {label && <span className="ex-button-label">{label}</span>}
    </button>
  );
}
