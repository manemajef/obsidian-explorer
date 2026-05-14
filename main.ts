import { Plugin } from "obsidian";
import {
  normalizePluginSettings,
  PluginSettings,
  resolveBlockSettings,
} from "./src/settings/schema";
import { renderExplorerBlock } from "./src/explorer";
import { parseSettings } from "./src/settings/block-parser";
import { ExplorerSettingsTab } from "./src/ui/settings-tab";

export default class ExplorerPlugin extends Plugin {
  settings: PluginSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new ExplorerSettingsTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor(
      "explorer",
      async (source, el, ctx) => {
        const defaults = this.settings.defaultBlockSettings;
        const effective = resolveBlockSettings(defaults, parseSettings(source));
        await renderExplorerBlock(this.app, el, ctx, defaults, effective);
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
