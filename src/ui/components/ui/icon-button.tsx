import React from "react";
import { Icon } from "../shared";

export function IconButton(props: {
  name: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}): JSX.Element {
  const { name, onClick, className } = props;

  return (
    <button
      type="button"
      className={`clickable-icon explorer-icon-btn ${className ?? ""}`}
      onClick={onClick}
    >
      <Icon name={name} />
    </button>
  );
}
