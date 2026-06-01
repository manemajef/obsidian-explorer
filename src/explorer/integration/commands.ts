import { App, Editor, MarkdownView, Plugin, TFile, TFolder } from "obsidian";
import type { PluginSettings } from "../settings";
import { openHomePage } from "../navigation/homepage";
import {
  canGoToParentFolderNote,
  goToParentFolderNote,
  type ExplorerLocation,
} from "../navigation/folder-notes";
import { promptAndCreateFolder } from "../vault/create";
import { togglePin } from "../vault/edit";
import { FOLDERNOTE_TEMPLATE } from "../lib/folder-note";
import { getActiveVirtualFolderNote } from "./virtual-folder-note-view";

type CommandDeps = {
  getSettings: () => PluginSettings;
  saveSettings: () => void | Promise<void>;
};

export function registerExplorerCommands(
  plugin: Plugin,
  deps: CommandDeps,
): void {
  const { app } = plugin;
  const { getSettings, saveSettings } = deps;

  plugin.addCommand({
    id: "insetrt-code-block",
    name: "Insert code block",
    checkCallback: (checking: boolean) => {
      const view = app.workspace.getActiveViewOfType(MarkdownView);
      const file = view?.file;

      if (!view || !(file instanceof TFile)) {
        return false;
      }

      if (!checking) {
        void insertExplorerCodeBlock(app, view, file);
      }

      return true;
    },
  });

  plugin.addCommand({
    id: "create-folder-in-current-folder",
    name: "Create folder in current note folder",
    checkCallback: (checking: boolean) => {
      const basePath = getActiveExplorerFolder(app)?.path;

      if (!basePath) {
        return false;
      }

      if (!checking) {
        void promptAndCreateFolder(app, basePath);
      }

      return true;
    },
  });

  plugin.addCommand({
    id: "go-to-homepage",
    name: "Go to homepage",
    checkCallback: (checking: boolean) => {
      if (!getSettings().useHomePage) {
        return false;
      }

      if (!checking) {
        const location = getActiveExplorerLocation(app);
        void openHomePage(app, getSettings(), location?.path ?? "");
      }

      return true;
    },
  });

  plugin.addCommand({
    id: "go-to-parent-folder",
    name: "Go to parent folder",
    checkCallback: (checking: boolean) => {
      const location = getActiveExplorerLocation(app);

      if (!canGoToParentFolderNote(app, getSettings(), location)) {
        return false;
      }

      if (!checking) {
        void goToParentFolderNote(app, getSettings(), {
          location,
          savePluginSettings: saveSettings,
        });
      }

      return true;
    },
  });

  plugin.addCommand({
    id: "toggle-pin",
    name: "Toggle pin for active note",
    checkCallback: (checking: boolean) => {
      const activeFile = app.workspace.getActiveFile();

      if (!activeFile || activeFile.extension !== "md") {
        return false;
      }

      if (!checking) {
        void togglePin(app, activeFile);
      }

      return true;
    },
  });
}

export function getActiveExplorerLocation(app: App): ExplorerLocation | null {
  const virtualView = getActiveVirtualFolderNote(app);
  const virtualFolder = virtualView?.folder;
  if (virtualView && virtualFolder) {
    return { folder: virtualFolder, path: virtualView.sourcePath, file: null };
  }
  const activeFile = app.workspace.getActiveFile();
  if (!activeFile?.parent) return null;
  return { folder: activeFile.parent, path: activeFile.path, file: activeFile };
}

export function getActiveExplorerFolder(app: App): TFolder | null {
  const virtualView = getActiveVirtualFolderNote(app);
  if (virtualView?.folder) return virtualView.folder;
  return app.workspace.getActiveFile()?.parent ?? null;
}

async function insertExplorerCodeBlock(
  app: App,
  view: MarkdownView,
  file: TFile,
): Promise<void> {
  const mode = view.getMode?.();
  const editor = mode !== "preview" ? view.editor : null;

  if (editor) {
    insertExplorerCodeBlockAtCursor(editor);
    return;
  }

  await appendExplorerCodeBlockToFile(app, file);
}

function insertExplorerCodeBlockAtCursor(editor: Editor): void {
  editor.replaceRange(FOLDERNOTE_TEMPLATE, editor.getCursor());
}

async function appendExplorerCodeBlockToFile(
  app: App,
  file: TFile,
): Promise<void> {
  const content = await app.vault.read(file);
  const separator = content.length === 0 || content.endsWith("\n") ? "" : "\n";
  await app.vault.modify(file, `${content}${separator}${FOLDERNOTE_TEMPLATE}`);
}
