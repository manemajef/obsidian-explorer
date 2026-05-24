import { App, Notice, TFile, TFolder } from "obsidian";
import { PluginSettings } from "./settings";
import { isFolderNote } from "./file-utils";
import { ConfirmationDialog } from "../ui/modals/prompt-modal";

export type SavePluginSettings = () => void | Promise<void>;

function askBeforeCreating(
  app: App,
  folder: TFolder,
  settings: PluginSettings,
  savePluginSettings: SavePluginSettings | undefined,
  onCreate: () => Promise<void>,
): void {
  const message = document.createDocumentFragment();
  message.append("The folder ");
  const folderNameEl = document.createElement("code");
  folderNameEl.classList.add("explorer-dialog-folder-name");
  folderNameEl.textContent = folder.name;
  message.append(
    folderNameEl,
    " doesn't have a folder note yet. Pressing Confirm will create a new folder note.",
  );

  new ConfirmationDialog(
    app,
    "Create folder note?",
    async () => {
      await onCreate();
    },
    async () => {
      settings.defaultBlockSettings.askForFolderNoteCreation = false;
      await savePluginSettings?.();
    },
    message,
  ).open();
}

const FOLDERNOTE_TEMPLATE = "\n```explorer\n```\n";
const HOME_PAGE_TEMPLATE =
  '```explorer\nview: "cards"\nsortBy: "edited"\ndepth: 10\npageSize: 21\n```\n';

export function canGoToParentFolderNote(
  app: App,
  settings: PluginSettings,
  currentFile: TFile | null,
): boolean {
  if (!currentFile) return false;

  const homePath = resolveHomePagePath(app, settings);
  if (homePath && currentFile.path === homePath) return false;
  const parent = isFolderNote(currentFile)
    ? currentFile.parent?.parent
    : currentFile.parent;
  return Boolean(parent && !parent.isRoot()) || settings.useHomePage;
}

export async function goToParentFolderNote(
  app: App,
  settings: PluginSettings,
  input: {
    currentFile: TFile | null;
    newLeaf?: boolean;
    savePluginSettings?: SavePluginSettings;
  },
): Promise<void> {
  const currentFile = input.currentFile;
  if (!currentFile) return;

  const sourcePath = currentFile.path;
  const homePath = resolveHomePagePath(app, settings);
  if (homePath && sourcePath === homePath) return;

  const parent = isFolderNote(currentFile)
    ? currentFile.parent?.parent
    : currentFile.parent;

  if (!parent || parent.isRoot()) {
    await openHomePage(app, settings, sourcePath, input.newLeaf);
    return;
  }

  await openOrCreateFolderNote(
    app,
    parent,
    settings,
    sourcePath,
    input.newLeaf,
    input.savePluginSettings,
  );
}

export async function openOrCreateFolderNote(
  app: App,
  folder: TFolder,
  settings: PluginSettings,
  sourcePath = "",
  newLeaf = false,
  savePluginSettings?: SavePluginSettings,
): Promise<void> {
  if (folder.isRoot()) {
    await openHomePage(app, settings, sourcePath, newLeaf);
    return;
  }

  const parentPath = folder.parent?.path;
  if (parentPath) {
    const parentNotePath =
      parentPath === "/"
        ? `${folder.name}.md`
        : `${parentPath}/${folder.name}.md`;
    const parentNote = app.vault.getAbstractFileByPath(parentNotePath);
    if (parentNote instanceof TFile) {
      void app.workspace.openLinkText(parentNote.path, sourcePath, newLeaf);
      return;
    }
  }

  const folderNotePath = `${folder.path}/${folder.name}.md`;
  const existing = app.vault.getAbstractFileByPath(folderNotePath);
  if (existing instanceof TFile) {
    void app.workspace.openLinkText(existing.path, sourcePath, newLeaf);
    return;
  }
  const tryCreateNew = async (): Promise<void> => {
    try {
      const created = await app.vault.create(
        folderNotePath,
        FOLDERNOTE_TEMPLATE,
      );
      void app.workspace.openLinkText(created.path, sourcePath, newLeaf);
    } catch (err) {
      new Notice(`Failed to create folder note: ${err}`);
    }
  };
  if (!settings.defaultBlockSettings.askForFolderNoteCreation) {
    await tryCreateNew();
  } else {
    askBeforeCreating(app, folder, settings, savePluginSettings, tryCreateNew);
  }
}

export async function openHomePage(
  app: App,
  settings: PluginSettings,
  sourcePath = "",
  newLeaf = false,
): Promise<void> {
  const configuredName = settings.homePageName.trim();
  if (
    settings.useHomePage &&
    (configuredName.includes("/") || configuredName.includes("\\"))
  ) {
    new Notice("Homepage name must be a root note name, not a path.");
    return;
  }

  const homePath = resolveHomePagePath(app, settings);
  if (!homePath) return;

  const existing = app.vault.getAbstractFileByPath(homePath);
  if (existing instanceof TFile) {
    await app.workspace.openLinkText(existing.path, sourcePath, newLeaf);
    return;
  }
  if (existing) {
    new Notice(`Homepage path is not a note: ${homePath}`);
    return;
  }

  try {
    const created = await app.vault.create(homePath, HOME_PAGE_TEMPLATE);
    await app.workspace.openLinkText(created.path, sourcePath, newLeaf);
  } catch (err) {
    new Notice(`Failed to create homepage: ${err}`);
  }
}

function resolveHomePagePath(
  app: App,
  settings: PluginSettings,
): string | null {
  if (!settings.useHomePage) return null;

  const configuredName = settings.homePageName.trim();
  const basename = (configuredName || app.vault.getName()).replace(
    /\.md$/i,
    "",
  );
  return basename && !basename.includes("/") && !basename.includes("\\")
    ? `${basename}.md`
    : null;
}
