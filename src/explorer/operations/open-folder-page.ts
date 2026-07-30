import { App, Notice, TFile, TFolder } from "obsidian";
import { ConfirmationDialog } from "../../ui/modals/prompt-modal";
import { openHomePage } from "./open-homepage";
import { PluginSettings } from "../settings";
import { openFileFreeFolderPage } from "./open-file-free-folder-page";
import { markNavigationPending } from "../data/navigation-pending";
import { type OpenFolderRequest } from "../domain/folder-page";
import {
  createFolderNoteFile,
  getFolderNoteForFolder,
} from "../vault/folder-note-file";
import {
  executeOpenFolderPage,
  type MarkdownFolderPagePresentation,
} from "../domain/folder-page-opening";

type SavePluginSettings = () => void | Promise<void>;

export async function openFolderPage(
  app: App,
  folder: TFolder,
  settings: PluginSettings,
  sourcePath = "",
  request: OpenFolderRequest = {},
  savePluginSettings?: SavePluginSettings,
): Promise<void> {
  await executeOpenFolderPage({
    folder,
    isRoot: folder.isRoot(),
    missingBehavior: settings.missingFolderNoteBehavior,
    forceReadingMode: settings.forceReadingMode,
    sourcePath,
    request,
    effects: {
      openHomepage: async (homepageSourcePath, newLeaf) => {
        await openHomePage(app, settings, homepageSourcePath, newLeaf);
      },
      findMarkdown: (target) => getFolderNoteForFolder(app, target),
      createMarkdown: async (target) => {
        if (
          !(await confirmFolderNoteCreation(
            app,
            target,
            settings,
            savePluginSettings,
          ))
        ) {
          return null;
        }
        const result = await createFolderNoteFile(app, target);
        if (result.kind === "collision") {
          new Notice(`Folder note path is not a note: ${result.path}`);
          return null;
        }
        if (result.kind === "failed") {
          new Notice(
            `Failed to create folder note: ${String(result.error)}`,
          );
          return null;
        }
        return result.file;
      },
      openMarkdown: async (file, presentation) => {
        await openMarkdownFolderPage(app, file, presentation);
      },
      openFileFree: async (target, newLeaf) => {
        await openFileFreeFolderPage(app, target, newLeaf);
      },
    },
  });
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
      () => resolve(true),
      async () => {
        settings.askForFolderNoteCreation = false;
        await savePluginSettings?.();
      },
      buildCreateFolderNoteMessage(folder),
      () => resolve(false),
    ).open();
  });
}

function buildCreateFolderNoteMessage(folder: TFolder): DocumentFragment {
  const message = createFragment();
  message.append("The folder ");
  const folderNameEl = message.createEl("code");
  folderNameEl.classList.add("explorer-dialog-folder-name");
  folderNameEl.textContent = folder.name;
  message.append(
    folderNameEl,
    " doesn't have a folder note yet. Pressing Confirm will create a new Markdown note for it.",
  );
  return message;
}

async function openMarkdownFolderPage(
  app: App,
  file: TFile,
  presentation: MarkdownFolderPagePresentation,
): Promise<void> {
  if (presentation.markNavigationPending) {
    markNavigationPending(file.path);
  }
  if (presentation.method === "file") {
    await app.workspace.getLeaf(presentation.newLeaf).openFile(file);
    return;
  }
  await app.workspace.openLinkText(
    file.path,
    presentation.sourcePath,
    presentation.newLeaf,
    presentation.forceReadingMode
      ? { state: { mode: "preview" } }
      : undefined,
  );
}
