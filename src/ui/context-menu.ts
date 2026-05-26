import type { MouseEvent as ReactMouseEvent } from "react";
import { App, Menu, TFile, TFolder } from "obsidian";
import {
  getFolderNoteForFolder,
  isFolderNote,
  isPinned,
  togglePin,
} from "../explorer/file-utils";
import {
  openOrCreateFolderNote,
  type SavePluginSettings,
} from "../explorer/navigation";
import type { PluginSettings } from "../explorer/settings";

export type ContextMenuConfig = {
  app: App;
  settings: PluginSettings;
  sourcePath: string;
  currentFolderPath: string;
  savePluginSettings?: SavePluginSettings;
  onRefresh: () => void;
};

export function showNoteContextMenu(
  event: ReactMouseEvent<HTMLElement>,
  config: ContextMenuConfig,
  file: TFile,
): void {
  const menu = beginMenu(event, config, file.path);
  const folder = file.parent;
  let hasAction = false;

  if (folder && folder.path !== config.currentFolderPath) {
    addFolderNoteNavigationItems(
      menu,
      config,
      folder,
      "Go to or create folder note",
    );
    hasAction = true;
  }
  hasAction = addPinItem(menu, config, file) || hasAction;

  if (hasAction) menu.addSeparator();
  menu.addItem((item) =>
    item
      .setTitle("Delete note")
      .setIcon("trash")
      .setWarning(true)
      .onClick(() => {
        void config.app.fileManager.promptForDeletion(file);
      }),
  );
  menu.showAtMouseEvent(event.nativeEvent);
}

export function showFolderContextMenu(
  event: ReactMouseEvent<HTMLElement>,
  config: ContextMenuConfig,
  folder: TFolder,
  linkPath = folderNotePath(folder),
): void {
  const menu = beginMenu(event, config, linkPath);
  const folderNote = getFolderNoteForFolder(config.app, folder);
  const hasAction = folderNote
    ? addPinItem(menu, config, folderNote)
    : false;

  if (hasAction) menu.addSeparator();
  menu.addItem((item) =>
    item
      .setTitle("Delete folder")
      .setIcon("trash")
      .setWarning(true)
      .onClick(() => {
        void config.app.fileManager.promptForDeletion(folder);
      }),
  );

  if (folderNote) {
    menu.addItem((item) =>
      item
        .setTitle("Delete folder note")
        .setIcon("file-x")
        .setWarning(true)
        .onClick(() => {
          void config.app.fileManager.promptForDeletion(folderNote);
        }),
    );
  }

  menu.showAtMouseEvent(event.nativeEvent);
}

export function showFileContextMenu(
  event: ReactMouseEvent<HTMLElement>,
  config: ContextMenuConfig,
  file: TFile,
): void {
  if (isFolderNote(file) && file.parent) {
    showFolderContextMenu(event, config, file.parent, file.path);
    return;
  }
  showNoteContextMenu(event, config, file);
}

function beginMenu(
  event: ReactMouseEvent<HTMLElement>,
  config: ContextMenuConfig,
  linkPath: string,
): Menu {
  event.preventDefault();
  event.stopPropagation();
  const menu = new Menu();
  config.app.workspace.handleLinkContextMenu(
    menu,
    linkPath,
    config.sourcePath,
  );
  menu.addSeparator();
  return menu;
}

function addFolderNoteNavigationItems(
  menu: Menu,
  config: ContextMenuConfig,
  folder: TFolder,
  label: string,
): void {
  menu.addItem((item) =>
    item.setTitle(label).setIcon("folder-open").onClick(() => {
      void openOrCreateFolderNote(
        config.app,
        folder,
        config.settings,
        config.sourcePath,
        false,
        config.savePluginSettings,
      );
    }),
  );
  menu.addItem((item) =>
    item.setTitle(`${label} in new tab`).setIcon("folder-plus").onClick(() => {
      void openOrCreateFolderNote(
        config.app,
        folder,
        config.settings,
        config.sourcePath,
        true,
        config.savePluginSettings,
      );
    }),
  );
}

function addPinItem(
  menu: Menu,
  config: ContextMenuConfig,
  file: TFile,
): boolean {
  if (file.extension.toLowerCase() !== "md") return false;

  menu.addItem((item) =>
    item
      .setTitle(isPinned(config.app, file) ? "Unpin note" : "Pin note")
      .setIcon("pin")
      .onClick(() => {
        togglePin(config.app, file);
        window.setTimeout(config.onRefresh, 100);
      }),
  );
  return true;
}

function folderNotePath(folder: TFolder): string {
  return `${folder.path}/${folder.name}.md`;
}
