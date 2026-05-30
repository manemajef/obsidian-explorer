import {
  Editor,
  MarkdownView,
  normalizePath,
  Notice,
  Plugin,
  TAbstractFile,
  TFile,
  TFolder,
  Vault,
} from "obsidian";
import {
  normalizePluginSettings,
  parseSettings,
  PluginSettings,
} from "./src/explorer/settings";
import { renderExplorerBlock } from "./src/explorer";
import { ExplorerSettingsTab } from "./src/ui/settings-tab";
import {
  canGoToParentFolderNote,
  type ExplorerLocation,
  goToParentFolderNote,
} from "./src/explorer/folder-notes";
import { openHomePage, registerHomePageNewTabs } from "./src/explorer/homepage";
import { promptAndCreateFolder } from "./src/explorer/vault/create";
import { togglePin } from "./src/explorer/vault/edit";
import {
  getActiveVirtualFolderNote,
  VIRTUAL_FOLDER_NOTE_VIEW_TYPE,
  VirtualFolderNoteView,
} from "./src/explorer/virtual-folder-note";

const FOLDERNOTE_TEMPLATE = "\n```explorer\n```\n";
type ExplorerRefresh = () => void;
type ForcedPreviewLeaf = MarkdownView["leaf"] & {
  _explorerViewForcedPreview?: boolean;
};
type VaultWithViewModeConfig = Vault & {
  config?: {
    defaultViewMode?: unknown;
  };
};

function getDefaultViewMode(vault: Vault): string {
  const mode = (vault as VaultWithViewModeConfig).config?.defaultViewMode;
  return typeof mode === "string" ? mode : "source";
}

export default class ExplorerPlugin extends Plugin {
  settings: PluginSettings;
  private explorerRefreshers = new Set<ExplorerRefresh>();

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new ExplorerSettingsTab(this.app, this));
    this.registerView(
      VIRTUAL_FOLDER_NOTE_VIEW_TYPE,
      (leaf) =>
        new VirtualFolderNoteView(leaf, {
          getBlockDefaults: () => this.settings.defaultBlockSettings,
          getPluginSettings: () => this.settings,
          savePluginSettings: () => this.saveSettings(),
          registerRefresh: (refresh) => this.registerExplorerRefresh(refresh),
        }),
    );
    this.registerCommands();

    this.registerMarkdownCodeBlockProcessor(
      "explorer",
      async (source, el, ctx) => {
        await renderExplorerBlock(
          this.app,
          el,
          ctx,
          () => this.settings.defaultBlockSettings,
          () => this.settings,
          () => this.saveSettings(),
          parseSettings(source),
          (refresh) => this.registerExplorerRefresh(refresh),
        );
      },
    );
    registerHomePageNewTabs(this, () => this.settings);

    this.registerEvent(
      this.app.vault.on(
        "rename",
        async (file: TAbstractFile, oldPath: string) => {
          if (this.settings.syncFolderNotes)
            await this.syncFolderNoteRename(file, oldPath);
        },
      ),
    );

    this.registerEvent(
      this.app.workspace.on("file-open", async (file) => {
        if (!file) return;
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;
        if (getDefaultViewMode(this.app.vault) === "preview") return;
        const leaf = view.leaf as ForcedPreviewLeaf;
        const content = await this.app.vault.cachedRead(file);
        const hasExplorerBlock = content.includes("```explorer");

        if (!this.settings.forceReadingMode && hasExplorerBlock) {
          setTimeout(() => {
            if (view.editor) {
              view.editor.blur();
            }
          }, 10);
          return;
        }
        if (hasExplorerBlock) {
          const state = leaf.getViewState();
          if (state.state && state.state.mode !== "preview")
            state.state.mode = "preview";
          await leaf.setViewState(state);
          leaf._explorerViewForcedPreview = true;
        } else if (leaf._explorerViewForcedPreview) {
          const state = leaf.getViewState();
          const defaultMode = getDefaultViewMode(this.app.vault);
          if (state.state) state.state.mode = defaultMode;
          await leaf.setViewState(state);
          delete leaf._explorerViewForcedPreview;
        }
      }),
    );
  }

  onunload() {}

  private registerCommands(): void {
    this.addCommand({
      id: "insetrt-code-block",
      name: "Insert code block",
      checkCallback: (checking: boolean) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const file = view?.file;

        if (!view || !(file instanceof TFile)) {
          return false;
        }

        if (!checking) {
          void this.insertExplorerCodeBlock(view, file);
        }

        return true;
      },
    });

    this.addCommand({
      id: "create-folder-in-current-folder",
      name: "Create folder in current note folder",
      checkCallback: (checking: boolean) => {
        const basePath = this.getActiveExplorerFolder()?.path;

        if (!basePath) {
          return false;
        }

        if (!checking) {
          void promptAndCreateFolder(this.app, basePath);
        }

        return true;
      },
    });

    this.addCommand({
      id: "go-to-homepage",
      name: "Go to homepage",
      checkCallback: (checking: boolean) => {
        if (!this.settings.useHomePage) {
          return false;
        }

        if (!checking) {
          const location = this.getActiveExplorerLocation();
          void openHomePage(this.app, this.settings, location?.path ?? "");
        }

        return true;
      },
    });

    this.addCommand({
      id: "go-to-parent-folder",
      name: "Go to parent folder",
      checkCallback: (checking: boolean) => {
        const location = this.getActiveExplorerLocation();

        if (!canGoToParentFolderNote(this.app, this.settings, location)) {
          return false;
        }

        if (!checking) {
          void goToParentFolderNote(this.app, this.settings, { location });
        }

        return true;
      },
    });

    this.addCommand({
      id: "toggle-pin",
      name: "Toggle pin for active note",
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();

        if (!activeFile || activeFile.extension !== "md") {
          return false;
        }

        if (!checking) {
          void togglePin(this.app, activeFile);
        }

        return true;
      },
    });
  }

  private async insertExplorerCodeBlock(
    view: MarkdownView,
    file: TFile,
  ): Promise<void> {
    const mode = view.getMode?.();
    const editor = mode !== "preview" ? view.editor : null;

    if (editor) {
      this.insertExplorerCodeBlockAtCursor(editor);
      return;
    }

    await this.appendExplorerCodeBlockToFile(file);
  }

  private insertExplorerCodeBlockAtCursor(editor: Editor): void {
    editor.replaceRange(FOLDERNOTE_TEMPLATE, editor.getCursor());
  }

  private async appendExplorerCodeBlockToFile(file: TFile): Promise<void> {
    const content = await this.app.vault.read(file);
    const separator =
      content.length === 0 || content.endsWith("\n") ? "" : "\n";
    await this.app.vault.modify(
      file,
      `${content}${separator}${FOLDERNOTE_TEMPLATE}`,
    );
  }

  async loadSettings(): Promise<void> {
    this.settings = normalizePluginSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private getActiveExplorerLocation(): ExplorerLocation | null {
    const virtualView = getActiveVirtualFolderNote(this.app);
    const virtualFolder = virtualView?.folder;
    if (virtualView && virtualFolder) {
      return { folder: virtualFolder, path: virtualView.sourcePath, file: null };
    }
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile?.parent) return null;
    return { folder: activeFile.parent, path: activeFile.path, file: activeFile };
  }

  private getActiveExplorerFolder(): TFolder | null {
    const virtualView = getActiveVirtualFolderNote(this.app);
    if (virtualView?.folder) return virtualView.folder;
    return this.app.workspace.getActiveFile()?.parent ?? null;
  }

  private async syncFolderNoteRename(
    file: TAbstractFile,
    oldPath: string,
  ): Promise<void> {
    try {
      if (file instanceof TFile) {
        await this.syncFolderFromFolderNote(file, oldPath);
      } else if (file instanceof TFolder) {
        await this.syncFolderNoteFromFolder(file, oldPath);
      }
    } catch (error) {
      new Notice(`Could not sync folder note rename: ${error}`);
    }
  }

  private async syncFolderFromFolderNote(
    file: TFile,
    oldPath: string,
  ): Promise<void> {
    if (file.extension.toLowerCase() !== "md") return;

    const filePath = file.path;
    await this.waitForVaultRenameToSettle();

    const currentFile = this.app.vault.getAbstractFileByPath(filePath);
    if (!(currentFile instanceof TFile)) return;

    const folder = currentFile.parent;
    const parentFolder = folder?.parent;
    if (!folder || !parentFolder) return;

    const oldFolderNoteName = oldPath.split("/").pop()?.replace(/\.md$/i, "");
    if (oldFolderNoteName !== folder.name) return;

    const destinationPath = normalizePath(
      `${parentFolder.path}/${currentFile.basename}`,
    );
    if (destinationPath === folder.path) return;
    if (this.app.vault.getAbstractFileByPath(destinationPath)) {
      new Notice(
        `Could not rename folder ${folder.name}: an item with that name already exists.`,
      );
      return;
    }

    await this.app.fileManager.renameFile(folder, destinationPath);
  }

  private async waitForVaultRenameToSettle(): Promise<void> {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  }

  private async syncFolderNoteFromFolder(
    folder: TFolder,
    oldPath: string,
  ): Promise<void> {
    const oldFolderName = oldPath.split("/").pop();
    if (!oldFolderName) return;

    const oldFolderNote = this.app.vault.getAbstractFileByPath(
      normalizePath(`${folder.path}/${oldFolderName}.md`),
    );
    if (!(oldFolderNote instanceof TFile)) return;

    const destinationPath = normalizePath(`${folder.path}/${folder.name}.md`);
    if (destinationPath === oldFolderNote.path) return;
    if (this.app.vault.getAbstractFileByPath(destinationPath)) {
      new Notice(
        `Could not rename folder note ${oldFolderNote.name}: an item with that name already exists.`,
      );
      return;
    }

    await this.app.fileManager.renameFile(oldFolderNote, destinationPath);
  }

  refreshExplorerBlocks(): void {
    for (const refresh of Array.from(this.explorerRefreshers)) {
      refresh();
    }
  }

  private registerExplorerRefresh(refresh: ExplorerRefresh): () => void {
    this.explorerRefreshers.add(refresh);
    return () => this.explorerRefreshers.delete(refresh);
  }
}
