import { App, Notice, TFile, TFolder } from "obsidian";
import { openHomePage, resolveHomePagePath } from "./homepage";
import { PluginSettings } from "./settings";
import { ConfirmationDialog } from "../ui/modals/prompt-modal";

export type SavePluginSettings = () => void | Promise<void>;

function askBeforeCreating(
  app: App,
  folder: TFolder,
  settings: PluginSettings,
  savePluginSettings: SavePluginSettings | undefined,
  onCreate: () => Promise<void>,
): void {
  const message = document.createDocumentFragment();
  message.append("The folder ");
  const folderNameEl = document.createElement("code");
  folderNameEl.classList.add("explorer-dialog-folder-name");
  folderNameEl.textContent = folder.name;
  message.append(
    folderNameEl,
    " doesn't have a folder note yet. Pressing Confirm will create a new folder note.",
  );

  new ConfirmationDialog(
    app,
    "Create folder note?",
    async () => {
      await onCreate();
    },
    async () => {
      settings.askForFolderNoteCreation = false;
      await savePluginSettings?.();
    },
    message,
  ).open();
}

const FOLDERNOTE_TEMPLATE = "\n```explorer\n```\n";

export function isFolderNote(file: TFile): boolean {
  if (!file.parent) return false;
  return file.basename === file.parent.name;
}

export function getFolderNotePath(folder: TFolder): string {
  return `${folder.path}/${folder.name}.md`;
}

export function getFolderNoteForFolder(
  app: App,
  folder: TFolder,
): TFile | null {
  const folderNotePath = getFolderNotePath(folder);
  const file = app.vault.getAbstractFileByPath(folderNotePath);
  return file instanceof TFile ? file : null;
}

export function canGoToParentFolderNote(
  app: App,
  settings: PluginSettings,
  currentFile: TFile | null,
): boolean {
  if (!currentFile) return false;

  const homePath = resolveHomePagePath(app, settings);
  if (homePath && currentFile.path === homePath) return false;
  const parent = isFolderNote(currentFile)
    ? currentFile.parent?.parent
    : currentFile.parent;
  return Boolean(parent && !parent.isRoot()) || settings.useHomePage;
}

export async function goToParentFolderNote(
  app: App,
  settings: PluginSettings,
  input: {
    currentFile: TFile | null;
    newLeaf?: boolean;
    savePluginSettings?: SavePluginSettings;
  },
): Promise<void> {
  const currentFile = input.currentFile;
  if (!currentFile) return;

  const sourcePath = currentFile.path;
  const homePath = resolveHomePagePath(app, settings);
  if (homePath && sourcePath === homePath) return;

  const parent = isFolderNote(currentFile)
    ? currentFile.parent?.parent
    : currentFile.parent;

  if (!parent || parent.isRoot()) {
    await openHomePage(app, settings, sourcePath, input.newLeaf);
    return;
  }

  await openOrCreateFolderNote(
    app,
    parent,
    settings,
    sourcePath,
    input.newLeaf,
    input.savePluginSettings,
  );
}

export async function openOrCreateFolderNote(
  app: App,
  folder: TFolder,
  settings: PluginSettings,
  sourcePath = "",
  newLeaf = false,
  savePluginSettings?: SavePluginSettings,
): Promise<void> {
  if (folder.isRoot()) {
    await openHomePage(app, settings, sourcePath, newLeaf);
    return;
  }

  const folderNotePath = getFolderNotePath(folder);
  const existing = getFolderNoteForFolder(app, folder);
  if (existing) {
    await openExplorerPage(app, existing, sourcePath, newLeaf);
    return;
  }
  const tryCreateNew = async (): Promise<void> => {
    try {
      const created = await app.vault.create(
        folderNotePath,
        FOLDERNOTE_TEMPLATE,
      );
      await openExplorerPage(app, created, sourcePath, newLeaf);
    } catch (err) {
      new Notice(`Failed to create folder note: ${err}`);
    }
  };
  if (!settings.askForFolderNoteCreation) {
    await tryCreateNew();
  } else {
    askBeforeCreating(app, folder, settings, savePluginSettings, tryCreateNew);
  }
}

async function openExplorerPage(
  app: App,
  file: TFile,
  sourcePath: string,
  newLeaf: boolean,
): Promise<void> {
  await app.workspace.openLinkText(file.path, sourcePath, newLeaf);
}
