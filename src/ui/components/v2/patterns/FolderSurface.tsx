import React from "react";
import { ExplorerActions } from "../../../../explorer/actions";
import { ExplorerFolderNode } from "../../../../explorer/lib/nodes";
import {
  isInteractiveTouchTarget,
  showFolderContextMenu,
  type ContextMenuConfig,
} from "../../../context-menu";
import { draggableProps, folderDropProps } from "../../../drag-drop";
import { Surface } from "../primitives";

type FolderSurfaceProps = {
  folder: ExplorerFolderNode;
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
  children: React.ReactNode;
};

export function FolderSurface({
  folder,
  actions,
  contextMenu,
  children,
}: FolderSurfaceProps): React.JSX.Element {
  return (
    <Surface
      variant="folder"
      interactive
      {...draggableProps(folder.folder)}
      {...folderDropProps(
        actions.app,
        folder.folder,
        (sourcePath, target, fromFolderNote) =>
          actions.movePathIntoFolder(sourcePath, target, fromFolderNote),
      )}
      onContextMenuCapture={(event) =>
        showFolderContextMenu(event, contextMenu, folder)
      }
      onClick={(event) => {
        if (isInteractiveTouchTarget(event.target)) return;
        void actions.openFolder(folder, event.ctrlKey || event.metaKey);
      }}
    >
      {children}
    </Surface>
  );
}
