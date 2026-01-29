import React from "react";
import { Icon } from "../shared";

export function ActionButton(props: {
  icon: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}): JSX.Element {
  const { icon, onClick, className } = props;

  return (
    <button
      type="button"
      className={`clickable-icon explorer-action ${className ?? ""}`}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
}

export function ActionGroup(props: {
  className?: string;
  children: React.ReactNode;
}): JSX.Element {
  const { className, children } = props;

  return (
    <div className={`explorer-action-group ${className ?? ""}`}>
      {children}
    </div>
  );
}
