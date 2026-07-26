import { App, TFile, TFolder } from "obsidian";
import { ConfirmationDialog } from "../../ui/modals/prompt-modal";
import type { FolderDataStore } from "../data/folder-data-store";
import type { ExplorerLocation } from "../domain/explorer-location";
import { resolveHomePagePath } from "../domain/homepage";
import { isFolderNote } from "../domain/folder-note";
import {
  BlockSettings,
  getBlockSettingsOverrides,
  PluginSettings,
} from "../settings";
import {
  getFolderNoteForFolder,
  readFolderNoteBlockSettings,
} from "../vault/folder-note-file";
import { deleteVaultEntry } from "../vault/entry-deletion";
import { openHomePage } from "./open-homepage";
import { executeRemoveMarkdownBacking } from "../domain/markdown-backing-transition";
import { openFileFreeFolderPage } from "./open-file-free-folder-page";

export async function removeMarkdownBacking(input: {
  app: App;
  location: ExplorerLocation | null;
  folder: TFolder;
  settings?: BlockSettings;
  folderDataStore: FolderDataStore;
  blockDefaults: BlockSettings;
  pluginSettings: PluginSettings;
}): Promise<void> {
  const file = findMarkdownBacking(input);
  if (!file) return;
  const settings =
    input.settings ??
    (await readFolderNoteBlockSettings(
      input.app,
      file,
      input.blockDefaults,
    ));
  const overrides = getBlockSettingsOverrides(
    settings,
    input.blockDefaults,
  );
  const isHomepage =
    input.folder.isRoot() &&
    file.path === resolveHomePagePath(input.app, input.pluginSettings);

  await executeRemoveMarkdownBacking({
    confirmDelete: () => confirmRemoval(input.app, file.basename),
    deleteMarkdown: () => deleteVaultEntry(input.app, file),
    storeOverrides: () =>
      input.folderDataStore.set(input.folder.path, overrides),
    openFileFree: async () => {
      if (isHomepage) {
        await openHomePage(
          input.app,
          input.pluginSettings,
          input.location?.path ?? "",
        );
        return;
      }
      await openFileFreeFolderPage(input.app, input.folder);
    },
  });
}

function findMarkdownBacking(
  input: Parameters<typeof removeMarkdownBacking>[0],
): TFile | null {
  const sourceFile = input.location?.file;
  const isBoundTarget =
    input.location?.folder.path === input.folder.path && sourceFile;
  if (
    isBoundTarget &&
    (isFolderNote(sourceFile) ||
      (input.folder.isRoot() &&
        sourceFile.path ===
          resolveHomePagePath(input.app, input.pluginSettings)))
  ) {
    return sourceFile;
  }
  return getFolderNoteForFolder(input.app, input.folder);
}

function confirmRemoval(app: App, name: string): Promise<boolean> {
  return new Promise((resolve) => {
    new ConfirmationDialog(
      app,
      "Remove the folder note file?",
      () => resolve(true),
      undefined,
      `This deletes the Markdown file "${name}" and any text written in it. The folder note keeps its settings.`,
      () => resolve(false),
    ).open();
  });
}
