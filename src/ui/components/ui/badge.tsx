import React from "react";
import { Icon } from "../shared";

type BadgeVariant = "ext" | "ext-filled" | "pin";

export function Badge(props: {
  variant: BadgeVariant;
  className?: string;
  children?: React.ReactNode;
}): React.JSX.Element {
  const { variant, className, children } = props;

  if (variant === "pin") {
    return (
      <span className={`explorer-badge pin ${className ?? ""}`}>
        <Icon name="heart" />
      </span>
    );
  }

  return (
    <span className={`explorer-badge ${variant} ${className ?? ""}`}>
      {children}
    </span>
  );
}
