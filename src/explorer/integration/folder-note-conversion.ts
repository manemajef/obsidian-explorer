import { App, TFile } from "obsidian";
import { BlockSettings, getBlockSettingsOverrides } from "../settings";
import { FolderDataStore } from "../data/folder-data-store";
import { openVirtualFolderNote } from "../navigation/virtual-folder-note";
import { ConfirmationDialog } from "../../ui/modals/prompt-modal";

/**
 * Turns a Markdown folder note back into a file-free one: stashes the block's
 * settings in the data store, deletes the Markdown file, and reopens the folder
 * as a file-free folder note. Asks first, since the file's text is discarded.
 */
export async function removeFolderNoteFile(
  app: App,
  store: FolderDataStore,
  file: TFile,
  settings: BlockSettings,
  blockDefaults: BlockSettings,
): Promise<void> {
  const folder = file.parent;
  if (!folder) return;

  const confirmed = await confirmRemoval(app, file.basename);
  if (!confirmed) return;

  store.set(folder.path, getBlockSettingsOverrides(settings, blockDefaults));
  await app.fileManager.trashFile(file);
  await openVirtualFolderNote(app, folder);
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
