import { Plugin } from "obsidian";
import {
  normalizePluginSettings,
  PluginSettings,
} from "./src/settings/schema";
import { ExplorerBridge } from "./src/plugin/explorer";
import { ExplorerAPI } from "./src/backend/explorer-api";
import { ExplorerSettingsTab } from "./src/ui/settings-tab";

export default class ExplorerPlugin extends Plugin {
  settings: PluginSettings;
  private api: ExplorerAPI;

  async onload() {
    await this.loadSettings();
    this.api = new ExplorerAPI(this.app);
    this.addSettingTab(new ExplorerSettingsTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor(
      "explorer",
      async (source, el, ctx) => {
        const effectiveSettings = this.api.resolveSettingsFromSource(
          source,
          this.settings.defaultBlockSettings,
        );
        const bridge = new ExplorerBridge(
          this.app,
          el,
          this.settings.defaultBlockSettings,
          effectiveSettings,
          ctx,
        );
        await bridge.render();
      },
    );
  }

  onunload() {}

  async loadSettings(): Promise<void> {
    this.settings = normalizePluginSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
