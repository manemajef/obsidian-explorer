import React from "react";
import { Icon } from "../shared";

type BadgeVariant = "ext" | "ext-filled" | "pin" | "tag";

export function Badge(props: {
  variant: BadgeVariant;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}): React.JSX.Element {
  const { variant, className, children, onClick } = props;

  if (variant === "pin") {
    return (
      <span
        className={`explorer-badge pin ${className ?? ""}`}
        onClick={onClick}
      >
        <Icon name="pin" />
      </span>
    );
  }

  return (
    <span
      className={`explorer-badge ${variant} ${className ?? ""}`}
      onClick={onClick}
    >
      {children}
    </span>
  );
}
