import { normalizePath, Plugin } from "obsidian";
import {
  normalizePluginSettings,
  parseSettings,
  PluginSettings,
} from "./src/explorer/settings";
import { renderExplorerBlock } from "./src/explorer/runtime";
import { ExplorerSettingsTab } from "./src/ui/settings-tab";
import { registerHomePageNewTabs } from "./src/explorer/integration/homepage-new-tabs";
import { VirtualFolderNoteView } from "./src/explorer/integration/virtual-folder-note-view";
import { VIRTUAL_FOLDER_NOTE_VIEW_TYPE } from "./src/explorer/operations/open-file-free-folder-page";
import { registerFileExplorerFolderNoteBehavior } from "./src/explorer/integration/file-explorer-folder-notes";
import { registerExplorerCommands } from "./src/explorer/integration/commands";
import { registerFolderNoteRenameSync } from "./src/explorer/integration/folder-note-rename-sync";
import { registerExplorerReadingMode } from "./src/explorer/integration/reading-mode";
import { registerWorkspaceDecorations } from "./src/explorer/integration/workspace-decorations";
import { FolderDataStore } from "./src/explorer/data/folder-data-store";
import { registerFolderDataSync } from "./src/explorer/integration/folder-data-sync";
import { registerExplorerTitlebarActions } from "./src/explorer/integration/titlebar-actions";
import { registerExplorerDevCodeBlock } from "./src/explorer/dev-registration";
import { ExplorerApi } from "./src/explorer/api";

type ExplorerRefresh = () => void;

export default class ExplorerPlugin extends Plugin {
  settings: PluginSettings;
  private folderDataStore: FolderDataStore;
  private explorerRefreshers = new Set<ExplorerRefresh>();
  private refreshFileExplorerFolderNotes: (() => void) | null = null;
  private refreshTitlebarActions: () => void = () => {};
  private explorerApi: ExplorerApi;

  async onload() {
    await this.loadSettings();
    this.folderDataStore = new FolderDataStore(
      this.app.vault.adapter,
      normalizePath(`${this.manifest.dir}/folder-data.json`),
    );
    await this.folderDataStore.load();
    this.explorerApi = new ExplorerApi({
      app: this.app,
      folderDataStore: this.folderDataStore,
      getBlockDefaults: () => this.settings.defaultBlockSettings,
      getSettings: () => this.settings,
      saveSettings: () => this.saveSettings(),
    });
    this.addSettingTab(new ExplorerSettingsTab(this.app, this));

    this.registerView(
      VIRTUAL_FOLDER_NOTE_VIEW_TYPE,
      (leaf) =>
        new VirtualFolderNoteView(leaf, {
          explorerApi: this.explorerApi,
          getBlockDefaults: () => this.settings.defaultBlockSettings,
          getPluginSettings: () => this.settings,
          savePluginSettings: () => this.saveSettings(),
          registerRefresh: (refresh) => this.registerExplorerRefresh(refresh),
          refreshTitlebarActions: () => this.refreshTitlebarActions(),
          folderDataStore: this.folderDataStore,
        }),
    );

    registerFolderDataSync(this, this.folderDataStore);

    registerExplorerCommands(this, this.explorerApi, {
      getSettings: () => this.settings,
    });
    this.refreshTitlebarActions = registerExplorerTitlebarActions(this, {
      explorerApi: this.explorerApi,
      getSettings: () => this.settings,
    });

    this.refreshFileExplorerFolderNotes =
      registerFileExplorerFolderNoteBehavior(this, {
        app: this.app,
        getSettings: () => this.settings,
        explorerApi: this.explorerApi,
      });

    this.registerMarkdownCodeBlockProcessor(
      "explorer",
      async (source, el, ctx) => {
        await renderExplorerBlock(
          this.explorerApi,
          this.app,
          el,
          ctx,
          () => this.settings.defaultBlockSettings,
          () => this.settings,
          parseSettings(source),
          (refresh) => this.registerExplorerRefresh(refresh),
        );
      },
    );

    if (this.settings.isDev) registerExplorerDevCodeBlock(this);

    registerHomePageNewTabs(this, () => this.settings);
    registerFolderNoteRenameSync(this, () => this.settings);
    registerExplorerReadingMode(this, () => this.settings);
    registerWorkspaceDecorations(this, this.app);
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
