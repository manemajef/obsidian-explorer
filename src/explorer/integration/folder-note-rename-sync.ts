import {
  App,
  normalizePath,
  Notice,
  Plugin,
  TAbstractFile,
  TFile,
  TFolder,
} from "obsidian";
import type { PluginSettings } from "../settings";

/**
 * Keeps a folder and its folder note named in lock-step: renaming one renames
 * the other. Only active while the `syncFolderNotes` setting is enabled.
 */
export function registerFolderNoteRenameSync(
  plugin: Plugin,
  getSettings: () => PluginSettings,
): void {
  plugin.registerEvent(
    plugin.app.vault.on(
      "rename",
      async (file: TAbstractFile, oldPath: string) => {
        if (getSettings().syncFolderNotes) {
          await syncFolderNoteRename(plugin.app, file, oldPath);
        }
      },
    ),
  );
}

async function syncFolderNoteRename(
  app: App,
  file: TAbstractFile,
  oldPath: string,
): Promise<void> {
  try {
    if (file instanceof TFile) {
      await syncFolderFromFolderNote(app, file, oldPath);
    } else if (file instanceof TFolder) {
      await syncFolderNoteFromFolder(app, file, oldPath);
    }
  } catch (error) {
    new Notice(`Could not sync folder note rename: ${error}`);
  }
}

async function syncFolderFromFolderNote(
  app: App,
  file: TFile,
  oldPath: string,
): Promise<void> {
  if (file.extension.toLowerCase() !== "md") return;

  const filePath = file.path;
  await waitForVaultRenameToSettle();

  const currentFile = app.vault.getAbstractFileByPath(filePath);
  if (!(currentFile instanceof TFile)) return;

  const folder = currentFile.parent;
  const parentFolder = folder?.parent;
  if (!folder || !parentFolder) return;

  const oldFolderNoteName = oldPath.split("/").pop()?.replace(/\.md$/i, "");
  if (oldFolderNoteName !== folder.name) return;

  const destinationPath = normalizePath(
    `${parentFolder.path}/${currentFile.basename}`,
  );
  if (destinationPath === folder.path) return;
  if (app.vault.getAbstractFileByPath(destinationPath)) {
    new Notice(
      `Could not rename folder ${folder.name}: an item with that name already exists.`,
    );
    return;
  }

  await app.fileManager.renameFile(folder, destinationPath);
}

async function waitForVaultRenameToSettle(): Promise<void> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
}

async function syncFolderNoteFromFolder(
  app: App,
  folder: TFolder,
  oldPath: string,
): Promise<void> {
  const oldFolderName = oldPath.split("/").pop();
  if (!oldFolderName) return;

  const oldFolderNote = app.vault.getAbstractFileByPath(
    normalizePath(`${folder.path}/${oldFolderName}.md`),
  );
  if (!(oldFolderNote instanceof TFile)) return;

  const destinationPath = normalizePath(`${folder.path}/${folder.name}.md`);
  if (destinationPath === oldFolderNote.path) return;
  if (app.vault.getAbstractFileByPath(destinationPath)) {
    new Notice(
      `Could not rename folder note ${oldFolderNote.name}: an item with that name already exists.`,
    );
    return;
  }

  await app.fileManager.renameFile(oldFolderNote, destinationPath);
}
