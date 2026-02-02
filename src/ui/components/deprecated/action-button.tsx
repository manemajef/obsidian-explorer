/**
 * DEPRECATED — kept as reference. Consumers now use glass.tsx directly.
 */
import React from "react";
import { Icon } from "../shared";

export function ActionButton(props: {
  icon: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}): React.JSX.Element {
  const { icon, onClick, className } = props;

  return (
    <button
      type="button"
      className={`clickable-icon explorer-action action-btn ${className ?? ""}`}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
}

export function ActionGroup(props: {
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const { className, children } = props;

  return (
    <div className={`explorer-action-group ${className ?? ""}`}>{children}</div>
  );
}
