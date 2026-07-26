/**
 * Interaction bundles — the drag + drop + context-menu + open wiring shared
 * by every file/folder representation. Feature components spread these onto
 * a semantic component; semantic components stay app-ignorant.
 */
import type { HTMLAttributes, MouseEvent } from "react";
import type { Explorer } from "../../explorer/api";
import {
  ExplorerFileNode,
  ExplorerFolderNode,
} from "../../explorer/model";
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
  explorer: Explorer,
  contextMenu: ContextMenuConfig,
  options: { openOnClick?: boolean } = {},
): InteractionProps<T> {
  const { openOnClick = true } = options;
  return {
    ...draggableProps<T>(file.dragSource, file.dragFromFolderNote),
    ...folderDropProps<T>(
      contextMenu.app,
      file.dropTargetFolder,
      (sourcePath, folder, fromFolderNote) =>
        void explorer
          .movePathIntoFolder(sourcePath, folder, fromFolderNote)
          .then((changed) => {
            if (changed) contextMenu.onChanged();
          }),
    ),
    onContextMenuCapture: (event) =>
      showFileContextMenu(event, contextMenu, file),
    ...(openOnClick && {
      onClick: (event: MouseEvent<T>) => {
        if (isInteractiveTouchTarget(event.target)) return;
        void explorer.openFile(file.file, {
          newLeaf: event.ctrlKey || event.metaKey,
        });
      },
    }),
  };
}

export function folderInteractionProps<
  T extends HTMLElement = HTMLDivElement,
>(
  folder: ExplorerFolderNode,
  explorer: Explorer,
  contextMenu: ContextMenuConfig,
): InteractionProps<T> {
  return {
    ...draggableProps<T>(folder.folder),
    ...folderDropProps<T>(
      contextMenu.app,
      folder.folder,
      (sourcePath, target, fromFolderNote) =>
        void explorer
          .movePathIntoFolder(sourcePath, target, fromFolderNote)
          .then((changed) => {
            if (changed) contextMenu.onChanged();
          }),
    ),
    onContextMenuCapture: (event) =>
      showFolderContextMenu(event, contextMenu, folder),
    onClick: (event: MouseEvent<T>) => {
      if (isInteractiveTouchTarget(event.target)) return;
      void contextMenu.explorer.openFolder(folder.folder, {
        newLeaf: event.ctrlKey || event.metaKey,
      });
    },
  };
}
