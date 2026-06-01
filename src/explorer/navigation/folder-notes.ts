import { App, TFile, TFolder } from "obsidian";
import { openHomePage, resolveHomePagePath } from "./homepage";
import { PluginSettings } from "../settings";
import { openVirtualFolderNote } from "./virtual-folder-note";
import {
  FOLDERNOTE_TEMPLATE,
  createFolderNoteFileWithConfirmation,
  getFolderNoteForFolder,
  isFolderNote,
  type SavePluginSettings,
} from "../lib/folder-note";

export type MissingFolderNoteIntent = "navigate" | "explicit" | "save";

/**
 * A place the explorer can be viewing: the folder whose contents are shown,
 * the source path used for link and homepage context, and the backing file
 * when one exists (null for temporary folder views).
 */
export type ExplorerLocation = {
  folder: TFolder;
  path: string;
  file: TFile | null;
};

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
    savePluginSettings?: SavePluginSettings;
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

  await openFolderNote(
    app,
    parent,
    settings,
    location.path,
    input.newLeaf,
    "navigate",
    input.savePluginSettings,
  );
}

export async function openFolderNote(
  app: App,
  folder: TFolder,
  settings: PluginSettings,
  sourcePath = "",
  newLeaf = false,
  intent: MissingFolderNoteIntent = "navigate",
  savePluginSettings?: SavePluginSettings,
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
  if (shouldCreateMissingFolderNote(settings, intent)) {
    await createAndOpenFolderNote(
      app,
      folder,
      settings,
      sourcePath,
      newLeaf,
      savePluginSettings,
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
    const created = await createFolderNoteFileWithConfirmation(
      app,
      folder,
      settings,
      savePluginSettings,
      content,
    );
    if (created) await openExplorerPage(app, created, sourcePath, newLeaf);
  };

  const existing = getFolderNoteForFolder(app, folder);
  if (existing) {
    await openExplorerPage(app, existing, sourcePath, newLeaf);
  } else {
    await tryCreateNew();
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

export function shouldCreateMissingFolderNote(
  settings: PluginSettings,
  intent: MissingFolderNoteIntent,
): boolean {
  switch (settings.missingFolderNoteBehavior) {
    case "create":
      return true;
    case "smart":
      return intent === "explicit" || intent === "save";
    case "manual":
      return intent === "save";
  }
}
