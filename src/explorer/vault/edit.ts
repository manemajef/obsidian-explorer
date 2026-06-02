import { App, normalizePath, Notice, TFile, TFolder } from "obsidian";
import { promptForName } from "../../ui/modals/prompt-modal";
import { getFolderNoteForFolder } from "../lib/folder-note";

export async function promptAndRenameFile(
  app: App,
  file: TFile,
): Promise<boolean> {
  const itemName = file.extension.toLowerCase() === "md" ? "note" : "file";
  const name = await promptForName(
    app,
    `Rename ${itemName}`,
    `Enter ${itemName} name`,
    file.basename,
    "Rename",
  );
  if (!name) return false;
  return renameFile(app, file, name);
}

export async function promptAndRenameFolder(
  app: App,
  folder: TFolder,
): Promise<boolean> {
  const name = await promptForName(
    app,
    "Rename folder",
    "Enter folder name",
    folder.name,
    "Rename",
  );
  if (!name) return false;
  return renameFolder(app, folder, name);
}

export function isPinned(app: App, file: TFile): boolean {
  const fm = app.metadataCache.getFileCache(file)?.frontmatter;
  return fm?.pin === true;
}

export async function togglePin(app: App, file: TFile): Promise<boolean> {
  const nextPinned = !isPinned(app, file);
  await app.fileManager.processFrontMatter(
    file,
    (frontmatter: Record<string, unknown>) => {
      if (nextPinned) {
        frontmatter["pin"] = true;
      } else {
        delete frontmatter["pin"];
      }
    },
  );
  return nextPinned;
}

async function renameFile(
  app: App,
  file: TFile,
  name: string,
): Promise<boolean> {
  if (!isValidName(name)) return false;

  const filename = file.extension ? `${name}.${file.extension}` : name;
  const destinationPath = childPath(file.parent, filename);
  if (destinationPath === file.path) return false;
  if (app.vault.getAbstractFileByPath(destinationPath)) {
    new Notice(
      `Could not rename ${file.name}: an item with that name already exists.`,
    );
    return false;
  }

  try {
    await app.fileManager.renameFile(file, destinationPath);
    return true;
  } catch (error) {
    new Notice(`Could not rename ${file.name}: ${error}`);
    return false;
  }
}

async function renameFolder(
  app: App,
  folder: TFolder,
  name: string,
): Promise<boolean> {
  if (!isValidName(name)) return false;

  const sourcePath = folder.path;
  const sourceName = folder.name;
  const destinationPath = childPath(folder.parent, name);
  if (destinationPath === sourcePath) return false;
  if (app.vault.getAbstractFileByPath(destinationPath)) {
    new Notice(
      `Could not rename ${sourceName}: an item with that name already exists.`,
    );
    return false;
  }

  const folderNote = getFolderNoteForFolder(app, folder);
  if (folderNote) {
    const conflictingNote = app.vault.getAbstractFileByPath(
      normalizePath(`${sourcePath}/${name}.md`),
    );
    if (conflictingNote && conflictingNote.path !== folderNote.path) {
      new Notice(
        `Could not rename ${sourceName}: ${name}.md already exists in the folder.`,
      );
      return false;
    }
  }

  try {
    await app.fileManager.renameFile(folder, destinationPath);

    if (folderNote) {
      const movedFolderNotePath = normalizePath(
        `${destinationPath}/${sourceName}.md`,
      );
      const movedFolderNote =
        app.vault.getAbstractFileByPath(movedFolderNotePath);
      if (!(movedFolderNote instanceof TFile)) {
        await rollBackFolderRename(app, folder, sourcePath);
        new Notice(
          "Could not rename folder: its folder note could not be found.",
        );
        return false;
      }

      try {
        await app.fileManager.renameFile(
          movedFolderNote,
          normalizePath(`${destinationPath}/${name}.md`),
        );
      } catch (error) {
        await rollBackFolderRename(app, folder, sourcePath);
        new Notice(`Could not rename folder note: ${error}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    new Notice(`Could not rename ${sourceName}: ${error}`);
    return false;
  }
}

async function rollBackFolderRename(
  app: App,
  folder: TFolder,
  sourcePath: string,
): Promise<void> {
  try {
    await app.fileManager.renameFile(folder, sourcePath);
  } catch {
    new Notice(
      "The folder was renamed, but its folder note could not be synchronized.",
    );
  }
}

function isValidName(name: string): boolean {
  if (!name.includes("/") && !name.includes("\\")) return true;
  new Notice("Names cannot include folder separators.");
  return false;
}

function childPath(parent: TFolder | null, name: string): string {
  return normalizePath(
    parent?.isRoot() ? name : `${parent?.path ?? ""}/${name}`,
  );
}
