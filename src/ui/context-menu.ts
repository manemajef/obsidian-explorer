import type { MouseEvent as ReactMouseEvent } from "react";
import { Menu, Platform } from "obsidian";
import { ExplorerActions } from "../explorer/actions";
import { ExplorerFileNode, ExplorerFolderNode } from "../explorer/nodes";
import { isCurrentlyDragging } from "./drag-drop";

export type ContextMenuConfig = {
  actions: ExplorerActions;
};

let pendingMenuTimeout: number | null = null;

export function cancelPendingContextMenu(): void {
  if (pendingMenuTimeout !== null) {
    window.clearTimeout(pendingMenuTimeout);
    pendingMenuTimeout = null;
  }
}

function showDelayedMenu(
  event: ReactMouseEvent<HTMLElement>,
  showFn: () => void,
): void {
  if (shouldDeferToNestedLink(event)) return;

  event.preventDefault();
  event.stopPropagation();

  if (Platform.isMobile) {
    if (isCurrentlyDragging()) return;

    cancelPendingContextMenu();

    const nativeEvent = event.nativeEvent;
    pendingMenuTimeout = window.setTimeout(() => {
      pendingMenuTimeout = null;
      if (isCurrentlyDragging()) return;
      showFn();
    }, 150);
    return;
  }

  showFn();
}

export function showNoteContextMenu(
  event: ReactMouseEvent<HTMLElement>,
  config: ContextMenuConfig,
  file: ExplorerFileNode,
): void {
  showDelayedMenu(event, () => {
    const menu = beginMenu(event, config, file.path);
    const folder = file.parentFolder;
    let hasAction = false;

    if (folder && folder.path !== config.actions.currentFolderPath) {
      addFolderNoteNavigationItems(
        menu,
        config,
        config.actions.createFolderNode(folder),
        "Go to or create folder note",
      );
      hasAction = true;
    }
    hasAction = addPinItem(menu, config, file) || hasAction;
    addRenameFileItem(menu, config, file);
    hasAction = true;

    if (hasAction) menu.addSeparator();
    menu.addItem((item) =>
      item
        .setTitle("Delete note")
        .setIcon("trash")
        .setWarning(true)
        .onClick(() => {
          config.actions.deleteFile(file);
        }),
    );
    menu.showAtMouseEvent(event.nativeEvent);
  });
}

export function showFolderContextMenu(
  event: ReactMouseEvent<HTMLElement>,
  config: ContextMenuConfig,
  folder: ExplorerFolderNode,
  linkPath = folder.folderNotePath,
): void {
  showDelayedMenu(event, () => {
    const menu = beginMenu(event, config, linkPath);
    const folderNote = folder.folderNoteNode;
    const hasAction = folderNote
      ? addPinItem(menu, config, folderNote)
      : false;

    if (hasAction) menu.addSeparator();
    menu.addItem((item) =>
      item.setTitle("Rename folder").setIcon("pencil").onClick(() => {
        void config.actions.renameFolder(folder);
      }),
    );
    menu.addSeparator();
    menu.addItem((item) =>
      item
        .setTitle("Delete folder")
        .setIcon("trash")
        .setWarning(true)
        .onClick(() => {
          config.actions.deleteFolder(folder);
        }),
    );

    if (folderNote) {
      menu.addItem((item) =>
        item
          .setTitle("Delete folder note")
          .setIcon("file-x")
          .setWarning(true)
          .onClick(() => {
            config.actions.deleteFolderNote(folder);
          }),
      );
    }

    menu.showAtMouseEvent(event.nativeEvent);
  });
}

export function showFileContextMenu(
  event: ReactMouseEvent<HTMLElement>,
  config: ContextMenuConfig,
  file: ExplorerFileNode,
): void {
  if (file.isFolderNote && file.parentFolder) {
    showFolderContextMenu(
      event,
      config,
      config.actions.createFolderNode(file.parentFolder),
      file.path,
    );
    return;
  }
  showNoteContextMenu(event, config, file);
}

function shouldDeferToNestedLink(event: ReactMouseEvent<HTMLElement>): boolean {
  if (!Platform.isMobile) return false;
  const target = event.target;
  if (!(target instanceof Element)) return false;

  const link = target.closest("a.internal-link");
  return Boolean(link && event.currentTarget.contains(link));
}

function beginMenu(
  event: ReactMouseEvent<HTMLElement>,
  config: ContextMenuConfig,
  linkPath: string,
): Menu {
  event.preventDefault();
  event.stopPropagation();
  const menu = new Menu();
  config.actions.app.workspace.handleLinkContextMenu(
    menu,
    linkPath,
    config.actions.sourcePath,
  );
  menu.addSeparator();
  return menu;
}

function addFolderNoteNavigationItems(
  menu: Menu,
  config: ContextMenuConfig,
  folder: ExplorerFolderNode,
  label: string,
): void {
  menu.addItem((item) =>
    item.setTitle(label).setIcon("folder-open").onClick(() => {
      void config.actions.openFolder(folder, false);
    }),
  );
  menu.addItem((item) =>
    item.setTitle(`${label} in new tab`).setIcon("folder-plus").onClick(() => {
      void config.actions.openFolder(folder, true);
    }),
  );
}

function addPinItem(
  menu: Menu,
  config: ContextMenuConfig,
  file: ExplorerFileNode,
): boolean {
  if (!file.isMarkdown) return false;

  menu.addItem((item) =>
    item
      .setTitle(file.isPinned ? "Unpin note" : "Pin note")
      .setIcon("pin")
      .onClick(() => {
        config.actions.togglePin(file);
      }),
  );
  return true;
}

function addRenameFileItem(
  menu: Menu,
  config: ContextMenuConfig,
  file: ExplorerFileNode,
): void {
  const itemName = file.isMarkdown ? "note" : "file";
  menu.addItem((item) =>
    item.setTitle(`Rename ${itemName}`).setIcon("pencil").onClick(() => {
      void config.actions.renameFile(file);
    }),
  );
}
