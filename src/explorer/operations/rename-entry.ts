import {
  App,
  normalizePath,
  Notice,
  TFile,
  TFolder,
} from "obsidian";
import { promptForName } from "../../ui/modals/prompt-modal";
import { getFolderNoteForFolder } from "../vault/folder-note-file";
import {
  renameVaultFile,
  renameVaultFolder,
} from "../vault/entry-rename";
import { executeFolderRename } from "../domain/folder-rename";

export async function renameFile(input: {
  app: App;
  file: TFile;
}): Promise<boolean> {
  const itemName =
    input.file.extension.toLowerCase() === "md" ? "note" : "file";
  const name = await promptForName(
    input.app,
    `Rename ${itemName}`,
    `Enter ${itemName} name`,
    input.file.basename,
    "Rename",
  );
  if (!name) return false;
  if (!isValidName(name)) return false;

  const filename = input.file.extension
    ? `${name}.${input.file.extension}`
    : name;
  const destinationPath = childPath(input.file.parent, filename);
  if (destinationPath === input.file.path) return false;
  if (input.app.vault.getAbstractFileByPath(destinationPath)) {
    new Notice(
      `Could not rename ${input.file.name}: an item with that name already exists.`,
    );
    return false;
  }

  const result = await renameVaultFile(
    input.app,
    input.file,
    destinationPath,
  );
  if (result.kind === "renamed") return true;
  new Notice(
    `Could not rename ${input.file.name}: ${String(result.error)}`,
  );
  return false;
}

export async function renameFolder(input: {
  app: App;
  folder: TFolder;
  name?: string;
}): Promise<boolean> {
  const name =
    input.name ??
    (await promptForName(
      input.app,
      "Rename folder",
      "Enter folder name",
      input.folder.name,
      "Rename",
    ));
  if (name === null) return false;
  if (!name) {
    new Notice("Folder name cannot be empty.");
    return false;
  }
  if (!isValidName(name, "Folder name cannot contain slashes.")) {
    return false;
  }

  const sourcePath = input.folder.path;
  const sourceName = input.folder.name;
  const destinationPath = childPath(input.folder.parent, name);
  if (destinationPath === sourcePath) return false;
  if (input.app.vault.getAbstractFileByPath(destinationPath)) {
    new Notice(
      `Could not rename ${sourceName}: an item with that name already exists.`,
    );
    return false;
  }

  const folderNote = getFolderNoteForFolder(input.app, input.folder);
  if (folderNote) {
    const conflictingNote = input.app.vault.getAbstractFileByPath(
      normalizePath(`${sourcePath}/${name}.md`),
    );
    if (conflictingNote && conflictingNote.path !== folderNote.path) {
      new Notice(
        `Could not rename ${sourceName}: ${name}.md already exists in the folder.`,
      );
      return false;
    }
  }

  const result = await executeFolderRename({
    hasFolderNote: folderNote !== null,
    renameFolder: () =>
      renameVaultFolder(input.app, input.folder, destinationPath),
    findMovedFolderNote: () => {
      const movedPath = normalizePath(
        `${destinationPath}/${sourceName}.md`,
      );
      const moved = input.app.vault.getAbstractFileByPath(movedPath);
      return moved instanceof TFile ? moved : null;
    },
    renameFolderNote: (file) =>
      renameVaultFile(
        input.app,
        file,
        normalizePath(`${destinationPath}/${name}.md`),
      ),
    rollBackFolder: () =>
      renameVaultFolder(input.app, input.folder, sourcePath),
  });

  if (result.kind === "renamed") return true;
  if (result.kind === "folder-rename-failed") {
    new Notice(`Could not rename ${sourceName}: ${String(result.error)}`);
    return false;
  }

  if (result.rollbackFailed) {
    new Notice(
      "The folder was renamed, but its folder note could not be synchronized.",
    );
  }
  if (result.kind === "folder-note-missing") {
    new Notice("Could not rename folder: its folder note could not be found.");
    return false;
  }
  new Notice(`Could not rename folder note: ${String(result.error)}`);
  return false;
}

function isValidName(
  name: string,
  message = "Names cannot include folder separators.",
): boolean {
  if (!name.includes("/") && !name.includes("\\")) return true;
  new Notice(message);
  return false;
}

function childPath(parent: TFolder | null, name: string): string {
  return normalizePath(
    parent?.isRoot() ? name : `${parent?.path ?? ""}/${name}`,
  );
}
