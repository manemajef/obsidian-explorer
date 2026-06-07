import React from "react";
import { Icon } from "../shared";

type BadgeVariant = "ext" | "ext-filled" | "pin";
type BadgeSize = "xs" | "sm" | "md";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Badge(props: {
  variant: BadgeVariant;
  className?: string;
  "data-pin-placement"?: string;
  size?: BadgeSize;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
}): React.JSX.Element {
  const {
    variant,
    className,
    "data-pin-placement": pinPlacement,
    size = "sm",
    style,
    children,
    onClick,
  } = props;
  const classes = cn(
    "explorer-badge",
    `explorer-badge--${variant}`,
    className,
  );

  if (variant === "pin") {
    return (
      <span
        className={classes}
        data-badge-size={size}
        data-badge-variant={variant}
        data-pin-placement={pinPlacement}
        style={style}
        onClick={onClick}
      >
        <Icon name="pin" />
      </span>
    );
  }
  return (
    <span
      className={classes}
      data-badge-size={size}
      data-badge-variant={variant}
      style={style}
      onClick={onClick}
    >
      {children}
    </span>
  );
}
