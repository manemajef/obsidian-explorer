import React from "react";
import { cn } from "../utils/cn";
import { Icon } from "./Icon";

type PinBadgeProps = {
  active?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
};

export function PinBadge({
  active = false,
  onClick,
  className,
}: PinBadgeProps): React.JSX.Element {
  return (
    <button
      className={cn("ex-pin-badge", className)}
      data-active={active || undefined}
      onClick={onClick}
      type="button"
    >
      {active && <Icon name="pin" size="sm" />}
    </button>
  );
}
