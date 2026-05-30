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

/**
 * A place the explorer can be viewing: the folder whose contents are shown,
 * the source path used for link and homepage context, and the backing file
 * when one exists (null for in-memory virtual folder notes).
 */
export type ExplorerLocation = {
  folder: TFolder;
  path: string;
  file: TFile | null;
};

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
  location: ExplorerLocation | null,
): boolean {
  if (!location) return false;

  const homePath = resolveHomePagePath(app, settings);
  if (homePath && location.path === homePath) return false;
  const parent = getNavigationParent(location);
  return Boolean(parent && !parent.isRoot()) || settings.useHomePage;
}

export async function goToParentFolderNote(
  app: App,
  settings: PluginSettings,
  input: {
    location: ExplorerLocation | null;
    newLeaf?: boolean;
  },
): Promise<void> {
  const location = input.location;
  if (!location) return;

  const homePath = resolveHomePagePath(app, settings);
  if (homePath && location.path === homePath) return;

  const parent = getNavigationParent(location);

  if (!parent || parent.isRoot()) {
    await openHomePage(app, settings, location.path, input.newLeaf);
    return;
  }

  await openFolderNote(app, parent, settings, location.path, input.newLeaf);
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

function getNavigationParent(location: ExplorerLocation): TFolder | null {
  // A folder note (real or virtual) steps up to the folder's parent; a plain
  // note inside a folder steps up to its own containing folder.
  const representsFolder = !location.file || isFolderNote(location.file);
  return representsFolder ? location.folder.parent : location.folder;
}
