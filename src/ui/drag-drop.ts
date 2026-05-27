import type { HTMLAttributes } from "react";
import { App, TAbstractFile, TFolder } from "obsidian";
import { canMoveIntoFolder } from "../explorer/move";

const EXPLORER_DRAG_TYPE = "application/x-obsidian-explorer-path";
const FOLDER_NOTE_DRAG_TYPE = "application/x-obsidian-explorer-folder-note";
const ACTIVE_DRAG_CLASS = "explorer-drag-active";
const DRAGGING_CLASS = "is-dragging";
const DROP_TARGET_CLASS = "is-drop-target";
let draggedItem: { path: string; fromFolderNote: boolean } | null = null;

export type MoveIntoFolder = (
  sourcePath: string,
  target: TFolder,
  fromFolderNote: boolean,
) => void | Promise<void>;

export function draggableProps<T extends HTMLElement>(
  source: TAbstractFile,
  fromFolderNote = false,
): Pick<HTMLAttributes<T>, "draggable" | "onDragStart" | "onDragEnd"> {
  return {
    draggable: true,
    onDragStart: (event) => {
      if (isControl(event.target)) {
        event.preventDefault();
        return;
      }

      draggedItem = { path: source.path, fromFolderNote };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(EXPLORER_DRAG_TYPE, source.path);
      if (fromFolderNote) {
        event.dataTransfer.setData(FOLDER_NOTE_DRAG_TYPE, "true");
      }
      event.currentTarget.ownerDocument.body.classList.add(ACTIVE_DRAG_CLASS);
      event.currentTarget.classList.add(DRAGGING_CLASS);
    },
    onDragEnd: (event) => {
      draggedItem = null;
      event.currentTarget.ownerDocument.body.classList.remove(ACTIVE_DRAG_CLASS);
      event.currentTarget.classList.remove(DRAGGING_CLASS);
      clearDropTargets(event.currentTarget.ownerDocument);
    },
  };
}

export function folderDropProps<T extends HTMLElement>(
  app: App,
  target: TFolder | null,
  onMoveIntoFolder: MoveIntoFolder,
): Pick<
  HTMLAttributes<T>,
  "onDragOverCapture" | "onDragLeaveCapture" | "onDropCapture"
> {
  if (!target) return {};

  return {
    onDragOverCapture: (event) => {
      const source = getDraggedSource(app);
      if (!source || !canMoveIntoFolder(source, target)) {
        event.currentTarget.classList.remove(DROP_TARGET_CLASS);
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      event.currentTarget.classList.add(DROP_TARGET_CLASS);
    },
    onDragLeaveCapture: (event) => {
      const nextTarget = event.relatedTarget;
      if (
        !(nextTarget instanceof Node) ||
        !event.currentTarget.contains(nextTarget)
      ) {
        event.currentTarget.classList.remove(DROP_TARGET_CLASS);
      }
    },
    onDropCapture: (event) => {
      event.currentTarget.classList.remove(DROP_TARGET_CLASS);
      const sourcePath =
        event.dataTransfer.getData(EXPLORER_DRAG_TYPE) || draggedItem?.path;
      const source = sourcePath
        ? app.vault.getAbstractFileByPath(sourcePath)
        : null;
      if (!source || !sourcePath || !canMoveIntoFolder(source, target)) return;

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.ownerDocument.body.classList.remove(ACTIVE_DRAG_CLASS);
      const fromFolderNote =
        event.dataTransfer.getData(FOLDER_NOTE_DRAG_TYPE) === "true" ||
        draggedItem?.fromFolderNote === true;
      void onMoveIntoFolder(sourcePath, target, fromFolderNote);
    },
  };
}

function getDraggedSource(app: App): TAbstractFile | null {
  return draggedItem
    ? app.vault.getAbstractFileByPath(draggedItem.path)
    : null;
}

function clearDropTargets(document: Document): void {
  document.querySelectorAll(`.${DROP_TARGET_CLASS}`).forEach((target) => {
    target.classList.remove(DROP_TARGET_CLASS);
  });
}

function isControl(target: EventTarget): boolean {
  return (
    target instanceof Element &&
    Boolean(target.closest(".pin, .explorer-card-pin-slot"))
  );
}
