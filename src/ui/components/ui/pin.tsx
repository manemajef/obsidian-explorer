import React from "react";
import { ExplorerFileNode } from "../../../explorer/lib/nodes";
import { ExplorerActions } from "../../../explorer/actions";
import { Badge } from "./badge";

export function Pin(props: {
  file: ExplorerFileNode;
  actions: ExplorerActions;
  className?: string;
  placement?: "inline" | "row-leading" | "card";
  reserveSpace?: boolean;
  size?: React.ComponentProps<typeof Badge>["size"];
}): React.JSX.Element {
  const {
    file,
    actions,
    className,
    placement = "inline",
    reserveSpace = true,
    size = "sm",
  } = props;
  if (file.isPinned)
    return (
      <Badge
        className={className}
        data-pin-placement={placement}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void actions.togglePin(file);
        }}
        size={size}
        variant="pin"
      />
    );
  return (
    <span
      className={className}
      data-pin-placement={placement}
      hidden={!reserveSpace}
    />
  );
}
