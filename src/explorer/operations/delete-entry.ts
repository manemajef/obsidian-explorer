import type { App, TFile, TFolder } from "obsidian";
import { ConfirmationDialog } from "../../ui/modals/prompt-modal";
import { deleteVaultEntry } from "../vault/entry-deletion";

export async function deleteFile(input: {
  app: App;
  file: TFile;
}): Promise<boolean> {
  return deleteVaultEntry(input.app, input.file);
}

export async function deleteFolder(input: {
  app: App;
  folder: TFolder;
}): Promise<boolean> {
  if (!(await confirmFolderDeletion(input.app, input.folder.name))) {
    return false;
  }
  return deleteVaultEntry(input.app, input.folder);
}

function confirmFolderDeletion(app: App, name: string): Promise<boolean> {
  return new Promise((resolve) => {
    new ConfirmationDialog(
      app,
      "Delete folder?",
      () => resolve(true),
      undefined,
      `This will delete the folder "${name}" and all of its contents.`,
      () => resolve(false),
    ).open();
  });
}
