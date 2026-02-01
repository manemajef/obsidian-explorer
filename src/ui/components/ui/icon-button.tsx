import React from "react";
import { Icon } from "../shared";

export function IconButton(props: {
  name: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  label?: string;
}): React.JSX.Element {
  const { name, onClick, className, label } = props;

  return (
    <button
      type="button"
      className={`clickable-icon explorer-icon-btn ${className ?? ""}`}
      onClick={onClick}
    >
      <span className="flex">
        <Icon name={name} />
        {label && label}
      </span>
    </button>
  );
}
