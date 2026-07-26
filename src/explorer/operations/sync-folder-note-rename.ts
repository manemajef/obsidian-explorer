import {
  App,
  Notice,
  TAbstractFile,
  TFile,
  TFolder,
  normalizePath,
} from "obsidian";
import {
  resolveFolderNoteRenameFromFolder,
  resolveFolderRenameFromFolderNote,
} from "../domain/folder-note-rename";
import {
  renameVaultFile,
  renameVaultFolder,
} from "../vault/entry-rename";

export async function syncFolderNoteRename(
  app: App,
  entry: TAbstractFile,
  oldPath: string,
): Promise<void> {
  try {
    if (entry instanceof TFile) {
      await syncFolderFromFolderNote(app, entry, oldPath);
    } else if (entry instanceof TFolder) {
      await syncFolderNoteFromFolder(app, entry, oldPath);
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
  const filePath = file.path;
  await waitForVaultRenameToSettle();

  const currentFile = app.vault.getAbstractFileByPath(filePath);
  if (!(currentFile instanceof TFile)) return;
  const folder = currentFile.parent;
  const parentFolder = folder?.parent;
  if (!folder || !parentFolder) return;

  const proposedPath = normalizePath(
    `${parentFolder.path}/${currentFile.basename}`,
  );
  const decision = resolveFolderRenameFromFolderNote({
    extension: currentFile.extension,
    oldPath,
    folderName: folder.name,
    folderPath: folder.path,
    parentPath: parentFolder.path,
    fileBasename: currentFile.basename,
    destinationExists:
      app.vault.getAbstractFileByPath(proposedPath) !== null,
  });
  if (decision.kind === "skip") return;
  if (decision.kind === "collision") {
    new Notice(
      `Could not rename folder ${folder.name}: an item with that name already exists.`,
    );
    return;
  }

  const result = await renameVaultFolder(
    app,
    folder,
    decision.destinationPath,
  );
  if (result.kind === "failed") {
    new Notice(
      `Could not sync folder note rename: ${String(result.error)}`,
    );
  }
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
  const oldFolderNotePath =
    oldFolderNote instanceof TFile ? oldFolderNote.path : null;
  const proposedPath = normalizePath(`${folder.path}/${folder.name}.md`);
  const decision = resolveFolderNoteRenameFromFolder({
    oldPath,
    folderPath: folder.path,
    folderName: folder.name,
    oldFolderNotePath,
    destinationExists:
      app.vault.getAbstractFileByPath(proposedPath) !== null,
  });
  if (decision.kind === "skip" || !(oldFolderNote instanceof TFile)) {
    return;
  }
  if (decision.kind === "collision") {
    new Notice(
      `Could not rename folder note ${oldFolderNote.name}: an item with that name already exists.`,
    );
    return;
  }

  const result = await renameVaultFile(
    app,
    oldFolderNote,
    decision.destinationPath,
  );
  if (result.kind === "failed") {
    new Notice(
      `Could not sync folder note rename: ${String(result.error)}`,
    );
  }
}
