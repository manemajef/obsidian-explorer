import { App, Notice } from "obsidian";
import { promptForName } from "../../ui/modals/prompt-modal";
import type { ExplorerLocation } from "../domain/explorer-location";
import { FOLDERNOTE_TEMPLATE } from "../domain/folder-note";
import type { PluginSettings } from "../settings";
import { createVaultFolder } from "../vault/entry-creation";
import { createFolderNoteFile } from "../vault/folder-note-file";
import { openFolderPage } from "./open-folder-page";

type SavePluginSettings = () => void | Promise<void>;

export async function createFolder(input: {
  app: App;
  location: ExplorerLocation | null;
  settings: PluginSettings;
  savePluginSettings: SavePluginSettings;
}): Promise<boolean> {
  if (!input.location) return false;
  const name = await promptForName(
    input.app,
    "New Folder",
    "Enter folder name",
  );
  if (!name) return false;

  const result = await createVaultFolder(
    input.app,
    input.location.folder.path,
    name,
  );
  if (result.kind === "collision") {
    new Notice(`Failed to create folder: ${result.path} already exists.`);
    return false;
  }
  if (result.kind === "failed") {
    new Notice(`Failed to create folder: ${String(result.error)}`);
    return false;
  }
  const folder = result.entry;

  if (input.settings.createFolderNoteOnNewFolder) {
    const backingResult = await createFolderNoteFile(
      input.app,
      folder,
      FOLDERNOTE_TEMPLATE,
    );
    if (backingResult.kind === "collision") {
      new Notice(
        `Folder note path is not a note: ${backingResult.path}`,
      );
    } else if (backingResult.kind === "failed") {
      new Notice(
        `Failed to create folder note: ${String(backingResult.error)}`,
      );
    }
  }

  await openFolderPage(
    input.app,
    folder,
    input.settings,
    input.location.path,
    { intent: "created-folder" },
    input.savePluginSettings,
  );
  return true;
}
