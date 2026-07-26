import { App, Editor, MarkdownView, Plugin, TFile } from "obsidian";
import type { PluginSettings } from "../settings";
import { FOLDERNOTE_TEMPLATE } from "../domain/folder-note";
import { isPinned } from "../domain/pin";
import { getActiveVirtualFolderNote } from "./virtual-folder-note-view";
import type { ExplorerApi } from "../api";
import { getActiveExplorerLocation } from "./active-location";
import { appendExplorerCodeBlockToFile } from "../operations/insert-explorer-block";

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
      const location = getActiveExplorerLocation(app);

      if (!location) {
        return false;
      }

      if (!checking) {
        void explorerApi.at(location).createFolder();
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
        void explorerApi
          .at(getActiveExplorerLocation(app))
          .openHomePage();
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
        void explorerApi
          .at(getActiveExplorerLocation(app))
          .addMarkdownBacking();
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
        void explorerApi
          .at(getActiveExplorerLocation(app))
          .setPinned(activeFile, !isPinned(app, activeFile));
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
