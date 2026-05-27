import React from "react";
import { ExplorerFileNode } from "../../../explorer/nodes";
import { ExplorerActions } from "../../../explorer/actions";
import { Badge } from "./badge";

export function Pin(props: {
  file: ExplorerFileNode;
  actions: ExplorerActions;
}): React.JSX.Element {
  const { file, actions } = props;
  if (file.isPinned)
    return (
      <Badge
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          actions.togglePin(file);
        }}
        variant="pin"
      />
    );
  return <span hidden />;
}
