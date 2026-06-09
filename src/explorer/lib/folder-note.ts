import { App, Notice, TFile, TFolder } from "obsidian";
import { ConfirmationDialog } from "../../ui/modals/prompt-modal";
import type { PluginSettings } from "../settings";

export const FOLDERNOTE_TEMPLATE = "\n```explorer\n```\n";
export type SavePluginSettings = () => void | Promise<void>;

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

export async function createFolderNoteFileWithConfirmation(
  app: App,
  folder: TFolder,
  settings: PluginSettings,
  savePluginSettings?: SavePluginSettings,
  content = FOLDERNOTE_TEMPLATE,
): Promise<TFile | null> {
  const existing = getFolderNoteForFolder(app, folder);
  if (existing) return existing;

  const confirmed = await confirmFolderNoteCreation(
    app,
    folder,
    settings,
    savePluginSettings,
  );
  if (!confirmed) return null;

  return createFolderNoteFile(app, folder, content);
}

function confirmFolderNoteCreation(
  app: App,
  folder: TFolder,
  settings: PluginSettings,
  savePluginSettings: SavePluginSettings | undefined,
): Promise<boolean> {
  if (!settings.askForFolderNoteCreation) return Promise.resolve(true);

  return new Promise((resolve) => {
    new ConfirmationDialog(
      app,
      "Create folder note?",
      () => {
        resolve(true);
      },
      async () => {
        settings.askForFolderNoteCreation = false;
        await savePluginSettings?.();
      },
      buildCreateFolderNoteMessage(folder),
      () => {
        resolve(false);
      },
    ).open();
  });
}

function buildCreateFolderNoteMessage(folder: TFolder): DocumentFragment {
  const message = window.activeDocument.createDocumentFragment();
  message.append("The folder ");
  const folderNameEl = window.activeDocument.createElement("code");
  folderNameEl.classList.add("explorer-dialog-folder-name");
  folderNameEl.textContent = folder.name;
  message.append(
    folderNameEl,
    " doesn't have a folder note yet. Pressing Confirm will create a new Markdown note for it.",
  );
  return message;
}
