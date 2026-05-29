import type { MouseEvent as ReactMouseEvent } from "react";
import { Menu, Platform, TAbstractFile } from "obsidian";
import { ExplorerActions } from "../explorer/actions";
import { ExplorerFileNode, ExplorerFolderNode } from "../explorer/nodes";

const HAPTIC_DURATION_MS = 10;

export type ContextMenuConfig = {
  actions: ExplorerActions;
};

export function showNoteContextMenu(
  event: ReactMouseEvent<HTMLElement>,
  config: ContextMenuConfig,
  file: ExplorerFileNode,
): void {
  if (shouldDeferToNestedLink(event)) return;

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
}

export function showFolderContextMenu(
  event: ReactMouseEvent<HTMLElement>,
  config: ContextMenuConfig,
  folder: ExplorerFolderNode,
): void {
  if (shouldDeferToNestedLink(event)) return;

  const menu = beginFileMenu(event, config, folder.folder);
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
    );
    return;
  }
  showNoteContextMenu(event, config, file);
}

function shouldDeferToNestedLink(event: ReactMouseEvent<HTMLElement>): boolean {
  return false;
}

export function isInteractiveTouchTarget(target: EventTarget): boolean {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "a, button, input, textarea, select, [role='button'], .pin, .explorer-badge, .value-list-item",
      ),
    )
  );
}

function triggerHapticFeedback(): void {
  if (!Platform.isMobile) return;
  globalThis.navigator.vibrate?.(HAPTIC_DURATION_MS);
}

function beginMenu(
  event: ReactMouseEvent<HTMLElement>,
  config: ContextMenuConfig,
  linkPath: string,
): Menu {
  event.preventDefault();
  event.stopPropagation();
  triggerHapticFeedback();
  const menu = new Menu();
  config.actions.app.workspace.handleLinkContextMenu(
    menu,
    linkPath,
    config.actions.sourcePath,
  );
  menu.addSeparator();
  return menu;
}

function beginFileMenu(
  event: ReactMouseEvent<HTMLElement>,
  config: ContextMenuConfig,
  file: TAbstractFile,
): Menu {
  event.preventDefault();
  event.stopPropagation();
  triggerHapticFeedback();
  const menu = new Menu();
  config.actions.app.workspace.trigger("file-menu", menu, file, "explorer");
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
        void config.actions.togglePin(file);
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
