import { Plugin } from "obsidian";
import {
  normalizePluginSettings,
  parseSettings,
  PluginSettings,
} from "./src/explorer/settings";
import { renderExplorerBlock } from "./src/explorer/runtime";
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

type ExplorerRefresh = () => void;

export default class ExplorerPlugin extends Plugin {
  settings: PluginSettings;
  private explorerRefreshers = new Set<ExplorerRefresh>();
  private refreshFileExplorerFolderNotes: (() => void) | null = null;

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

    registerExplorerCommands(this, {
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
        );
      },
    );

    registerHomePageNewTabs(this, () => this.settings);
    registerFolderNoteRenameSync(this, () => this.settings);
    registerExplorerReadingMode(this, () => this.settings);
  }

  onunload() {}

  async loadSettings(): Promise<void> {
    this.settings = normalizePluginSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.refreshFileExplorerFolderNotes?.();
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
