import { normalizePath, Plugin, TFile } from "obsidian";
import {
  normalizePluginSettings,
  parseSettings,
  PluginSettings,
} from "./src/explorer/settings";
import {
  renderExplorerBlock,
  type FolderNoteConversion,
} from "./src/explorer/runtime";
import { isFolderNote } from "./src/explorer/lib/folder-note";
import {
  removeFolderNoteFile,
  removeFolderNoteFileByReadingBlock,
} from "./src/explorer/integration/folder-note-conversion";
import { ExplorerSettingsTab } from "./src/ui/settings-tab";
import { registerHomePageNewTabs } from "./src/explorer/navigation/homepage";
import {
  VIRTUAL_FOLDER_NOTE_VIEW_TYPE,
  VirtualFolderNoteView,
} from "./src/explorer/integration/virtual-folder-note-view";
import { registerFileExplorerFolderNoteBehavior } from "./src/explorer/integration/file-explorer-folder-notes";
import { registerExplorerCommands } from "./src/explorer/integration/commands";
import { registerFolderNoteRenameSync } from "./src/explorer/integration/folder-note-rename-sync";
import { registerExplorerReadingMode } from "./src/explorer/integration/reading-mode";
import { FolderDataStore } from "./src/explorer/data/folder-data-store";
import { registerFolderDataSync } from "./src/explorer/integration/folder-data-sync";
import { registerExplorerTitlebarActions } from "./src/explorer/integration/titlebar-actions";
import { registerExplorerDevCodeBlock } from "./src/explorer/dev-registration";

type ExplorerRefresh = () => void;

export default class ExplorerPlugin extends Plugin {
  settings: PluginSettings;
  private folderDataStore: FolderDataStore;
  private explorerRefreshers = new Set<ExplorerRefresh>();
  private refreshFileExplorerFolderNotes: (() => void) | null = null;
  private refreshTitlebarActions: () => void = () => {};

  async onload() {
    await this.loadSettings();
    this.folderDataStore = new FolderDataStore(
      this.app.vault.adapter,
      normalizePath(`${this.manifest.dir}/folder-data.json`),
    );
    await this.folderDataStore.load();
    this.addSettingTab(new ExplorerSettingsTab(this.app, this));

    this.registerView(
      VIRTUAL_FOLDER_NOTE_VIEW_TYPE,
      (leaf) =>
        new VirtualFolderNoteView(leaf, {
          getBlockDefaults: () => this.settings.defaultBlockSettings,
          getPluginSettings: () => this.settings,
          savePluginSettings: () => this.saveSettings(),
          registerRefresh: (refresh) => this.registerExplorerRefresh(refresh),
          refreshTitlebarActions: () => this.refreshTitlebarActions(),
          getFolderData: (path) => this.folderDataStore.get(path),
          setFolderData: (path, overrides) =>
            this.folderDataStore.set(path, overrides),
          deleteFolderData: (path) => this.folderDataStore.delete(path),
          removeFolderNoteFile: (file) =>
            removeFolderNoteFileByReadingBlock(
              this.app,
              this.folderDataStore,
              file,
              this.settings.defaultBlockSettings,
            ),
        }),
    );

    registerFolderDataSync(this, this.folderDataStore);

    registerExplorerCommands(this, {
      getSettings: () => this.settings,
      saveSettings: () => this.saveSettings(),
    });
    this.refreshTitlebarActions = registerExplorerTitlebarActions(this, {
      getSettings: () => this.settings,
      saveSettings: () => this.saveSettings(),
    });

    this.refreshFileExplorerFolderNotes =
      registerFileExplorerFolderNoteBehavior(this, {
        app: this.app,
        getSettings: () => this.settings,
      });

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
          this.buildFolderNoteConversion(ctx.sourcePath),
          (file) =>
            removeFolderNoteFileByReadingBlock(
              this.app,
              this.folderDataStore,
              file,
              this.settings.defaultBlockSettings,
            ),
        );
      },
    );

    this.settings.isDev && registerExplorerDevCodeBlock(this);

    registerHomePageNewTabs(this, () => this.settings);
    registerFolderNoteRenameSync(this, () => this.settings);
    registerExplorerReadingMode(this, () => this.settings);
  }

  onunload() {
    void this.folderDataStore?.flush();
  }

  async loadSettings(): Promise<void> {
    this.settings = normalizePluginSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.refreshFileExplorerFolderNotes?.();
    this.refreshTitlebarActions();
  }

  private buildFolderNoteConversion(
    sourcePath: string,
  ): FolderNoteConversion | undefined {
    const file = this.app.vault.getAbstractFileByPath(sourcePath);
    if (!(file instanceof TFile) || !isFolderNote(file)) return undefined;

    return {
      isFile: true,
      convert: (settings) =>
        removeFolderNoteFile(
          this.app,
          this.folderDataStore,
          file,
          settings,
          this.settings.defaultBlockSettings,
        ),
    };
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
