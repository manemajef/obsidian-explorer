import { App, Notice, TFile, TFolder, WorkspaceLeaf } from "obsidian";
import { PluginSettings } from "./settings";
import {
  getFolderNoteForFolder,
  getFolderNotePath,
  isFolderNote,
} from "./file-utils";
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

  const folderNotePath = getFolderNotePath(folder);
  const existing = getFolderNoteForFolder(app, folder);
  if (existing) {
    await openExplorerPage(app, existing, sourcePath, newLeaf);
    return;
  }
  const tryCreateNew = async (): Promise<void> => {
    try {
      const created = await app.vault.create(
        folderNotePath,
        FOLDERNOTE_TEMPLATE,
      );
      await openExplorerPage(app, created, sourcePath, newLeaf);
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
  await useHomePageFile(app, settings, async (file) => {
    await openExplorerPage(app, file, sourcePath, newLeaf);
  });
}

export async function openHomePageInEmptyLeaf(
  app: App,
  settings: PluginSettings,
  leaf: WorkspaceLeaf,
): Promise<void> {
  if (!isEmptyLeaf(leaf)) return;

  await useHomePageFile(app, settings, async (file) => {
    if (!isEmptyLeaf(leaf)) return;
    await leaf.openFile(file);
  });
}

async function useHomePageFile(
  app: App,
  settings: PluginSettings,
  openFile: (file: TFile) => Promise<void>,
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
    await openFile(existing);
    return;
  }
  if (existing) {
    new Notice(`Homepage path is not a note: ${homePath}`);
    return;
  }

  try {
    const created = await app.vault.create(homePath, HOME_PAGE_TEMPLATE);
    await openFile(created);
  } catch (err) {
    new Notice(`Failed to create homepage: ${err}`);
  }
}

function isEmptyLeaf(leaf: WorkspaceLeaf): boolean {
  return leaf.getViewState().type === "empty";
}

async function openExplorerPage(
  app: App,
  file: TFile,
  sourcePath: string,
  newLeaf: boolean,
): Promise<void> {
  await app.workspace.openLinkText(file.path, sourcePath, newLeaf);
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
