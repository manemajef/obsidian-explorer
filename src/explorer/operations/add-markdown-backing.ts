import { App, Notice } from "obsidian";
import { ConfirmationDialog } from "../../ui/modals/prompt-modal";
import type { FolderDataStore } from "../data/folder-data-store";
import type { ExplorerLocation } from "../domain/explorer-location";
import {
  BlockSettings,
  PluginSettings,
  resolveBlockSettings,
} from "../settings";
import { formatExplorerBlock } from "../domain/explorer-block";
import {
  getFolderNotePath,
  writeFolderNoteFile,
} from "../vault/folder-note-file";
import { getHomePageInitialOverrides } from "../domain/homepage";
import { executeAddMarkdownBacking } from "../domain/markdown-backing-transition";

export async function addMarkdownBacking(input: {
  app: App;
  location: ExplorerLocation | null;
  settings?: BlockSettings;
  folderDataStore: FolderDataStore;
  blockDefaults: BlockSettings;
  pluginSettings: PluginSettings;
  savePluginSettings: () => void | Promise<void>;
}): Promise<void> {
  const { location } = input;
  if (!location || location.file) return;

  const path = location.path || getFolderNotePath(location.folder);
  const settings =
    input.settings ??
    resolveBlockSettings(input.blockDefaults, {
      ...getHomePageInitialOverrides(
        input.app,
        input.pluginSettings,
        location.path,
      ),
      ...input.folderDataStore.get(location.folder.path),
    });
  const content = formatExplorerBlock(settings, input.blockDefaults);

  await executeAddMarkdownBacking({
    confirmWrite: () => confirmMarkdownBackingCreation(input, path),
    writeMarkdown: async () => {
      const result = await writeFolderNoteFile(input.app, path, content);
      if (result.kind === "collision") {
        new Notice(`Folder note path is not a note: ${result.path}`);
        return null;
      }
      if (result.kind === "failed") {
        new Notice(`Failed to create folder note: ${String(result.error)}`);
        return null;
      }
      return result.file;
    },
    deleteStoredOverrides: () =>
      input.folderDataStore.delete(location.folder.path),
    openMarkdown: async (file) => {
      await input.app.workspace.openLinkText(
        file.path,
        location.path,
        false,
      );
    },
  });
}

function confirmMarkdownBackingCreation(
  input: Parameters<typeof addMarkdownBacking>[0],
  path: string,
): Promise<boolean> {
  const existing = input.app.vault.getAbstractFileByPath(path);
  if (existing || !input.pluginSettings.askForFolderNoteCreation)
    return Promise.resolve(true);

  return new Promise((resolve) => {
    new ConfirmationDialog(
      input.app,
      "Create Markdown note?",
      () => resolve(true),
      async () => {
        input.pluginSettings.askForFolderNoteCreation = false;
        await input.savePluginSettings();
      },
      `The note "${path}" doesn't exist yet. Pressing Confirm will create a new Markdown note for it.`,
      () => resolve(false),
    ).open();
  });
}
