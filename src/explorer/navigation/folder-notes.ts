import { App, TFile, TFolder } from "obsidian";
import { openHomePage } from "./homepage";
import { PluginSettings } from "../settings";
import { openVirtualFolderNote } from "./virtual-folder-note";
import { markNavigationPending } from "./navigation-pending";
import {
  createFolderNoteFileWithConfirmation,
  getFolderNoteForFolder,
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
    await openExplorerPage(
      app,
      existing,
      sourcePath,
      newLeaf,
      settings.forceReadingMode,
    );
    return;
  }
  if (shouldCreateMissingFolderNote(settings, intent)) {
    const created = await createFolderNoteFileWithConfirmation(
      app,
      folder,
      settings,
      savePluginSettings,
    );
    if (created) {
      await openExplorerPage(
        app,
        created,
        sourcePath,
        newLeaf,
        settings.forceReadingMode,
      );
    }
    return;
  }
  await openVirtualFolderNote(app, folder, newLeaf);
}

async function openExplorerPage(
  app: App,
  file: TFile,
  sourcePath: string,
  newLeaf: boolean,
  forceReadingMode = false,
): Promise<void> {
  markNavigationPending(file.path);
  await app.workspace.openLinkText(
    file.path,
    sourcePath,
    newLeaf,
    forceReadingMode ? { state: { mode: "preview" } } : undefined,
  );
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
