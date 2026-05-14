import { App, PluginSettingTab, Setting } from "obsidian";
import ExplorerPlugin from "../../main";
import {
  BlockSettingKey,
  BlockSettings,
  SettingsSection,
  createDefaultPluginSettings,
  getSettingKeysForSurface,
  getSettingSection,
} from "../settings/schema";
import { renderSettingField } from "./render-setting-field";

type SectionMeta = {
  title: string;
  description?: string;
};

const SECTION_ORDER: SettingsSection[] = [
  "core",
  "behavior",
  "display",
  "appearance",
  "navigation",
];

const SECTION_META: Record<SettingsSection, SectionMeta> = {
  core: {
    title: "Block defaults",
    description: "These can be overridden per code block.",
  },
  behavior: {
    title: "Behavior",
  },
  display: {
    title: "Default display",
    description: "Visibility defaults for new blocks.",
  },
  appearance: {
    title: "Appearance",
    description: "Plugin-wide visuals that apply to every explorer.",
  },
  navigation: {
    title: "Navigation",
  },
};

// Global plugin defaults UI (Obsidian settings tab).
export class ExplorerSettingsTab extends PluginSettingTab {
  plugin: ExplorerPlugin;

  constructor(app: App, plugin: ExplorerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const settings = this.plugin.settings.defaultBlockSettings;
    const keys = getSettingKeysForSurface("plugin");
    const fieldRefs = new Map<BlockSettingKey, Setting>();

    for (const section of SECTION_ORDER) {
      const sectionKeys = keys.filter((key) => getSettingSection(key) === section);
      if (sectionKeys.length === 0) {
        continue;
      }

      const meta = SECTION_META[section];
      new Setting(containerEl).setName(meta.title).setHeading();
      if (meta.description) {
        containerEl.createEl("p", {
          text: meta.description,
          cls: "setting-item-description",
        });
      }

      for (const key of sectionKeys) {
        renderSettingField(
          containerEl,
          key,
          settings,
          "plugin",
          (k, v) => this.updateSetting(k, v),
          fieldRefs,
        );
      }
    }

    new Setting(containerEl).addButton((button) => {
      button.setButtonText("Reset all to defaults").onClick(async () => {
        this.plugin.settings = createDefaultPluginSettings();
        await this.plugin.saveSettings();
        this.display();
      });
    });
  }

  private async updateSetting<K extends keyof BlockSettings>(
    key: K,
    value: BlockSettings[K],
  ) {
    this.plugin.settings.defaultBlockSettings[key] = value;
    await this.plugin.saveSettings();
  }
}
