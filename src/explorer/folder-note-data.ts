import { App, Notice, TFile, TFolder } from "obsidian";

export const FOLDERNOTE_TEMPLATE = "\n```explorer\n```\n";

export function isFolderNote(file: TFile): boolean {
  if (!file.parent) return false;
  return file.basename === file.parent.name;
}

export function getFolderNotePath(folder: TFolder): string {
  return `${folder.path}/${folder.name}.md`;
}

export function getFolderNoteForFolder(
  app: App,
  folder: TFolder,
): TFile | null {
  const folderNotePath = getFolderNotePath(folder);
  const file = app.vault.getAbstractFileByPath(folderNotePath);
  return file instanceof TFile ? file : null;
}

export async function createFolderNoteFile(
  app: App,
  folder: TFolder,
  content = FOLDERNOTE_TEMPLATE,
): Promise<TFile | null> {
  const existing = getFolderNoteForFolder(app, folder);
  if (existing) return existing;

  try {
    return await app.vault.create(getFolderNotePath(folder), content);
  } catch (err) {
    new Notice(`Failed to create folder note: ${err}`);
    return null;
  }
}
