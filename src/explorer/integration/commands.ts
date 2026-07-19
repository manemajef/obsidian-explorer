import { App, Editor, MarkdownView, Plugin, TFile } from "obsidian";
import type { PluginSettings } from "../settings";
import { openHomePage } from "../navigation/homepage";
import { promptAndCreateFolder } from "../vault/create";
import { openVirtualFolderNote } from "../navigation/virtual-folder-note";
import { togglePin } from "../vault/edit";
import { FOLDERNOTE_TEMPLATE } from "../lib/folder-note";
import { getActiveVirtualFolderNote } from "./virtual-folder-note-view";
import type { ExplorerApi } from "../api";
import {
  getActiveExplorerFolder,
  getActiveExplorerLocation,
} from "./active-location";

type CommandDeps = {
  getSettings: () => PluginSettings;
};

export function registerExplorerCommands(
  plugin: Plugin,
  explorerApi: ExplorerApi,
  deps: CommandDeps,
): void {
  const { app } = plugin;
  const { getSettings } = deps;

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
        const createFolderNote = getSettings().createFolderNoteOnNewFolder;
        void promptAndCreateFolder(app, basePath, createFolderNote).then(
          (folder) => {
            if (folder && !createFolderNote) {
              void openVirtualFolderNote(app, folder);
            }
          },
        );
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

      const explorer = explorerApi.at(location);
      if (!explorer.canGoToParent()) {
        return false;
      }

      if (!checking) {
        void explorer.goToParent();
      }

      return true;
    },
  });

  plugin.addCommand({
    id: "save-virtual-folder-note",
    name: "Save folder note as Markdown",
    checkCallback: (checking: boolean) => {
      const virtualView = getActiveVirtualFolderNote(app);

      if (!virtualView?.folder) {
        return false;
      }

      if (!checking) {
        void virtualView.materialize();
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
