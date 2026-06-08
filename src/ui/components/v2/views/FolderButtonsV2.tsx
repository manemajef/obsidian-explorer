import React from "react";
import { ExplorerActions } from "../../../../explorer/actions";
import { ExplorerFolderNode } from "../../../../explorer/lib/nodes";
import type { ContextMenuConfig } from "../../../context-menu";
import { cn } from "../utils/cn";
import { FolderButtonContent, FolderSurface } from "../patterns";

type FolderButtonsV2Props = {
  folders: ExplorerFolderNode[];
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
};

export function FolderButtonsV2({
  folders,
  actions,
  contextMenu,
}: FolderButtonsV2Props): React.JSX.Element {
  return (
    <div
      className={cn(
        "ex-folders-grid",
        folders.length < 3 && "ex-folders-grid--sparse",
      )}
    >
      {folders.map((folder) => (
        <FolderSurface
          key={folder.folderNotePath}
          folder={folder}
          actions={actions}
          contextMenu={contextMenu}
        >
          <FolderButtonContent folder={folder} actions={actions} />
        </FolderSurface>
      ))}
    </div>
  );
}
