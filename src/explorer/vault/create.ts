import { App, Notice, TFile } from "obsidian";
import { promptForName } from "../../ui/modals/prompt-modal";

const FOLDERNOTE_TEMPLATE = "\n```explorer\n```\n";

export async function createFolderWithNote(
  app: App,
  basePath: string,
  name: string,
  template = FOLDERNOTE_TEMPLATE,
): Promise<void> {
  const folderPath = `${basePath}/${name}`;
  const folderNotePath = `${folderPath}/${name}.md`;

  try {
    if (!app.vault.getAbstractFileByPath(folderPath)) {
      await app.vault.createFolder(folderPath);
    }

    let file = app.vault.getAbstractFileByPath(folderNotePath);
    if (!file) file = await app.vault.create(folderNotePath, template);
    if (file instanceof TFile) await app.workspace.getLeaf(false).openFile(file);
  } catch (e) {
    new Notice(`Failed to create folder: ${e}`);
  }
}

export async function createNewNote(
  app: App,
  basePath: string,
  name: string,
): Promise<void> {
  const notePath = `${basePath}/${name}.md`;

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
): Promise<void> {
  const name = await promptForName(app, "New Folder", "Enter folder name");
  if (name) await createFolderWithNote(app, basePath, name);
}

export async function promptAndCreateNote(
  app: App,
  basePath: string,
): Promise<void> {
  const name = await promptForName(app, "New Note", "Enter note name");
  if (name) await createNewNote(app, basePath, name);
}
