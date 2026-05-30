import { App, TFile, TFolder } from "obsidian";
import { openHomePage, resolveHomePagePath } from "./homepage";
import { PluginSettings } from "./settings";
import { ConfirmationDialog } from "../ui/modals/prompt-modal";
import { openVirtualFolderNote } from "./virtual-folder-note";
import {
  FOLDERNOTE_TEMPLATE,
  createFolderNoteFile,
  getFolderNoteForFolder,
  isFolderNote,
} from "./folder-note-data";

export {
  FOLDERNOTE_TEMPLATE,
  createFolderNoteFile,
  getFolderNoteForFolder,
  getFolderNotePath,
  isFolderNote,
} from "./folder-note-data";

export type SavePluginSettings = () => void | Promise<void>;
export type VirtualFolderNoteSource = {
  folder: TFolder;
  path: string;
};
export type FolderNoteSource = TFile | VirtualFolderNoteSource;

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

export function canGoToParentFolderNote(
  app: App,
  settings: PluginSettings,
  source: FolderNoteSource | null,
): boolean {
  if (!source) return false;

  const homePath = resolveHomePagePath(app, settings);
  if (homePath && getFolderNoteSourcePath(source) === homePath)
    return false;
  const parent = getParentFolderForNavigation(source);
  return Boolean(parent && !parent.isRoot()) || settings.useHomePage;
}

export async function goToParentFolderNote(
  app: App,
  settings: PluginSettings,
  input: {
    source: FolderNoteSource | null;
    newLeaf?: boolean;
  },
): Promise<void> {
  const source = input.source;
  if (!source) return;

  const sourcePath = getFolderNoteSourcePath(source);
  const homePath = resolveHomePagePath(app, settings);
  if (homePath && sourcePath === homePath) return;

  const parent = getParentFolderForNavigation(source);

  if (!parent || parent.isRoot()) {
    await openHomePage(app, settings, sourcePath, input.newLeaf);
    return;
  }

  await openFolderNote(app, parent, settings, sourcePath, input.newLeaf);
}

export async function openFolderNote(
  app: App,
  folder: TFolder,
  settings: PluginSettings,
  sourcePath = "",
  newLeaf = false,
): Promise<void> {
  if (folder.isRoot()) {
    await openHomePage(app, settings, sourcePath, newLeaf);
    return;
  }

  const existing = getFolderNoteForFolder(app, folder);
  if (existing) {
    await openExplorerPage(app, existing, sourcePath, newLeaf);
    return;
  }
  if (settings.missingFolderNoteBehavior === "create") {
    await createAndOpenFolderNote(
      app,
      folder,
      settings,
      sourcePath,
      newLeaf,
    );
    return;
  }
  await openVirtualFolderNote(app, folder, newLeaf);
}

export async function createAndOpenFolderNote(
  app: App,
  folder: TFolder,
  settings: PluginSettings,
  sourcePath = "",
  newLeaf = false,
  savePluginSettings?: SavePluginSettings,
  content = FOLDERNOTE_TEMPLATE,
): Promise<void> {
  if (folder.isRoot()) {
    await openHomePage(app, settings, sourcePath, newLeaf);
    return;
  }

  const tryCreateNew = async (): Promise<void> => {
    const created = await createFolderNoteFile(app, folder, content);
    if (created) await openExplorerPage(app, created, sourcePath, newLeaf);
  };

  const existing = getFolderNoteForFolder(app, folder);
  if (existing) {
    await openExplorerPage(app, existing, sourcePath, newLeaf);
  } else if (!settings.askForFolderNoteCreation) {
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

function getFolderNoteSourcePath(source: FolderNoteSource): string {
  return source instanceof TFile ? source.path : source.path;
}

function getParentFolderForNavigation(
  source: FolderNoteSource,
): TFolder | null | undefined {
  if (!(source instanceof TFile)) return source.folder.parent;
  return isFolderNote(source) ? source.parent?.parent : source.parent;
}
