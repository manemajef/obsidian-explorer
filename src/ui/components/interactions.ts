/**
 * Interaction bundles — the drag + drop + context-menu + open wiring shared
 * by every file/folder representation. Feature components spread these onto
 * a semantic component; semantic components stay app-ignorant.
 */
import type { HTMLAttributes, MouseEvent } from "react";
import { ExplorerActions } from "../../explorer/actions";
import {
  ExplorerFileNode,
  ExplorerFolderNode,
} from "../../explorer/lib/nodes";
import { draggableProps, folderDropProps } from "../drag-drop";
import {
  isInteractiveTouchTarget,
  showFileContextMenu,
  showFolderContextMenu,
  type ContextMenuConfig,
} from "../context-menu";

type InteractionProps<T extends HTMLElement> = Pick<
  HTMLAttributes<T>,
  | "draggable"
  | "onDragStart"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragOver"
  | "onDragLeave"
  | "onDrop"
  | "onContextMenuCapture"
  | "onClick"
>;

export function fileInteractionProps<T extends HTMLElement = HTMLDivElement>(
  file: ExplorerFileNode,
  actions: ExplorerActions,
  contextMenu: ContextMenuConfig,
  options: { openOnClick?: boolean } = {},
): InteractionProps<T> {
  const { openOnClick = true } = options;
  return {
    ...draggableProps<T>(file.dragSource, file.dragFromFolderNote),
    ...folderDropProps<T>(
      actions.app,
      file.dropTargetFolder,
      (sourcePath, folder, fromFolderNote) =>
        actions.movePathIntoFolder(sourcePath, folder, fromFolderNote),
    ),
    onContextMenuCapture: (event) =>
      showFileContextMenu(event, contextMenu, file),
    ...(openOnClick && {
      onClick: (event: MouseEvent<T>) => {
        if (isInteractiveTouchTarget(event.target)) return;
        void actions.openFile(file, event.ctrlKey || event.metaKey);
      },
    }),
  };
}

export function folderInteractionProps<
  T extends HTMLElement = HTMLDivElement,
>(
  folder: ExplorerFolderNode,
  actions: ExplorerActions,
  contextMenu: ContextMenuConfig,
): InteractionProps<T> {
  return {
    ...draggableProps<T>(folder.folder),
    ...folderDropProps<T>(
      actions.app,
      folder.folder,
      (sourcePath, target, fromFolderNote) =>
        actions.movePathIntoFolder(sourcePath, target, fromFolderNote),
    ),
    onContextMenuCapture: (event) =>
      showFolderContextMenu(event, contextMenu, folder),
    onClick: (event: MouseEvent<T>) => {
      if (isInteractiveTouchTarget(event.target)) return;
      void actions.openFolder(folder, event.ctrlKey || event.metaKey);
    },
  };
}
