import { App, Notice, TFile, TFolder, normalizePath } from "obsidian";
import { promptForName } from "../../ui/modals/prompt-modal";
import { FOLDERNOTE_TEMPLATE } from "../lib/folder-note";

export async function createFolderWithNote(
  app: App,
  basePath: string,
  name: string,
  createFolderNote: boolean,
  template = FOLDERNOTE_TEMPLATE,
): Promise<TFolder | null> {
  const folderPath = normalizePath(`${basePath}/${name}`);

  try {
    if (!app.vault.getAbstractFileByPath(folderPath)) {
      await app.vault.createFolder(folderPath);
    }

    if (createFolderNote) {
      const folderNotePath = normalizePath(`${folderPath}/${name}.md`);
      let file = app.vault.getAbstractFileByPath(folderNotePath);
      if (!file) file = await app.vault.create(folderNotePath, template);
      if (file instanceof TFile) {
        await app.workspace.getLeaf(false).openFile(file);
      }
    }

    const folder = app.vault.getAbstractFileByPath(folderPath);
    return folder instanceof TFolder ? folder : null;
  } catch (e) {
    new Notice(`Failed to create folder: ${e}`);
    return null;
  }
}

export async function createNewNote(
  app: App,
  basePath: string,
  name: string,
): Promise<void> {
  const notePath = normalizePath(`${basePath}/${name}.md`);

  try {
    const existing = app.vault.getAbstractFileByPath(notePath);
    if (existing instanceof TFile) {
      await app.workspace.getLeaf(false).openFile(existing);
      return;
    }

    await app.workspace.getLeaf(false).openFile(await app.vault.create(notePath, ""));
  } catch (e) {
    new Notice(`Failed to create note: ${e}`);
  }
}

export async function promptAndCreateFolder(
  app: App,
  basePath: string,
  createFolderNote: boolean,
): Promise<TFolder | null> {
  const name = await promptForName(app, "New Folder", "Enter folder name");
  if (!name) return null;
  return createFolderWithNote(app, basePath, name, createFolderNote);
}

export async function promptAndCreateNote(
  app: App,
  basePath: string,
): Promise<void> {
  const name = await promptForName(app, "New Note", "Enter note name");
  if (name) await createNewNote(app, basePath, name);
}
