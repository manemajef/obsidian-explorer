import React from "react";
import { FileInfo } from "src/types";
import { Badge } from "./badge";

export function Pin(props: { fileInfo: FileInfo }): React.JSX.Element {
  const { fileInfo } = props;
  if (fileInfo.isPinned)
    return <Badge onClick={() => fileInfo.togglePin()} variant="pin" />;
  return <span />;
}
