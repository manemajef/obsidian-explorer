import React from "react";
import { ExplorerActions } from "../../../../explorer/actions";
import { ExplorerFileNode } from "../../../../explorer/lib/nodes";
import type { ExplorerModel } from "../../../../explorer/model";
import {
  isInteractiveTouchTarget,
  showFileContextMenu,
  type ContextMenuConfig,
} from "../../../context-menu";
import { draggableProps, folderDropProps } from "../../../drag-drop";
import { Surface, type SurfaceVariant } from "../primitives";

type FileSurfaceProps = {
  file: ExplorerFileNode;
  model: ExplorerModel;
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
  surfaceVariant?: Extract<SurfaceVariant, "plain" | "card" | "item">;
  children: React.ReactNode;
};

export function FileSurface({
  file,
  actions,
  contextMenu,
  surfaceVariant = "item",
  children,
}: FileSurfaceProps): React.JSX.Element {
  return (
    <Surface
      variant={surfaceVariant}
      interactive
      {...draggableProps(file.dragSource, file.dragFromFolderNote)}
      {...folderDropProps(
        actions.app,
        file.dropTargetFolder,
        (sourcePath, folder, fromFolderNote) =>
          actions.movePathIntoFolder(sourcePath, folder, fromFolderNote),
      )}
      onContextMenuCapture={(event) =>
        showFileContextMenu(event, contextMenu, file)
      }
      onClick={(event) => {
        if (isInteractiveTouchTarget(event.target)) return;
        void actions.openFile(file, event.ctrlKey || event.metaKey);
      }}
    >
      {children}
    </Surface>
  );
}
