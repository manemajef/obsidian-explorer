import React from "react";
import { Icon } from "../shared";

type BadgeVariant = "ext" | "ext-filled" | "pin" | "tag";

export function Badge(props: {
  variant: BadgeVariant;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
}): React.JSX.Element {
  const { variant, className, style, children, onClick } = props;

  if (variant === "pin") {
    return (
      <span
        className={`explorer-badge pin ${className ?? ""}`}
        style={style}
        onClick={onClick}
      >
        <Icon name="pin" />
      </span>
    );
  }
  if (variant == "tag") {
    return (
      <span
        className={`value-list-item value-list-item-tag ${className ?? ""}`}
        style={style}
        onClick={onClick}
      >
        <a className="tag">{children}</a>
      </span>
    );
  }

  return (
    <span
      className={`explorer-badge ${variant} ${className ?? ""}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </span>
  );
}
