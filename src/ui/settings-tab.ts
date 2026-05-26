import { App, PluginSettingTab, Setting } from "obsidian";
import ExplorerPlugin from "../../main";
import {
  BlockSettingKey,
  BlockSettings,
  PLUGIN_SETTINGS_SCHEMA,
  PluginGlobalSettings,
  PluginSettingKey,
  SettingsSection,
  getSettingSurfaces,
  createDefaultPluginSettings,
  getPluginSettingKeysForSection,
  getSettingKeysForSurface,
  getSettingSection,
  isPluginSettingVisible,
} from "../explorer/settings";
import { renderSettingField } from "./render-setting-field";
import { isHomePageNewTabManagedElsewhere } from "../explorer/new-tab";

type SectionMeta = {
  title: string;
  description?: string;
};

const SECTION_ORDER: SettingsSection[] = [
  "navigation",
  "appearance",
  "behavior",
  "core",
  "display",
];

const DEFAULT_BLOCK_SECTION_ORDER: SettingsSection[] = [
  "core",
  "display",
  "behavior",
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

function compareBySection(
  a: BlockSettingKey,
  b: BlockSettingKey,
  sectionOrder: SettingsSection[],
): number {
  const aSection = getSettingSection(a);
  const bSection = getSettingSection(b);
  const sectionDiff =
    sectionOrder.indexOf(aSection) - sectionOrder.indexOf(bSection);

  if (sectionDiff !== 0) {
    return sectionDiff;
  }

  const orderedKeys = getSettingKeysForSurface("plugin");
  return orderedKeys.indexOf(a) - orderedKeys.indexOf(b);
}

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
    const pluginOnlyKeys = keys.filter(
      (key) => !getSettingSurfaces(key).includes("block"),
    );
    const defaultBlockKeys = keys
      .filter((key) => getSettingSurfaces(key).includes("block"))
      .sort((a, b) => compareBySection(a, b, DEFAULT_BLOCK_SECTION_ORDER));
    const fieldRefs = new Map<BlockSettingKey, Setting>();

    for (const section of SECTION_ORDER) {
      const sectionKeys = pluginOnlyKeys.filter(
        (key) => getSettingSection(key) === section,
      );
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

      if (section === "navigation") {
        this.renderNavigationSettings(containerEl);
      }

      for (const key of sectionKeys) {
        renderSettingField(
          containerEl,
          key,
          settings,
          "plugin",
          (k, v) => {
            void this.updateSetting(k, v);
          },
          fieldRefs,
        );
      }
    }

    if (defaultBlockKeys.length > 0) {
      const meta = SECTION_META.core;
      new Setting(containerEl).setName(meta.title).setHeading();
      if (meta.description) {
        containerEl.createEl("p", {
          text: meta.description,
          cls: "setting-item-description",
        });
      }

      for (const key of defaultBlockKeys) {
        renderSettingField(
          containerEl,
          key,
          settings,
          "plugin",
          (k, v) => {
            void this.updateSetting(k, v);
          },
          fieldRefs,
        );
      }
    }

    new Setting(containerEl).addButton((button) => {
      button.setButtonText("Reset all to defaults").onClick(async () => {
        this.plugin.settings = createDefaultPluginSettings();
        await this.plugin.saveSettings();
        this.plugin.refreshExplorerBlocks();
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
    this.plugin.refreshExplorerBlocks();
  }

  private renderNavigationSettings(containerEl: HTMLElement): void {
    for (const key of getPluginSettingKeysForSection("navigation")) {
      if (!isPluginSettingVisible(key, this.plugin.settings)) continue;
      this.renderPluginSetting(containerEl, key);
    }
  }

  private renderPluginSetting(containerEl: HTMLElement, key: PluginSettingKey) {
    const field = PLUGIN_SETTINGS_SCHEMA[key];
    const description =
      key === "openHomePageInNewTabs" &&
      isHomePageNewTabManagedElsewhere(this.app)
        ? "Inactive while the New Tab Default Page plugin is enabled because it manages this behavior."
        : field.description;
    const setting = new Setting(containerEl)
      .setName(field.label)
      .setDesc(description);

    if (field.kind === "boolean") {
      setting.addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings[key] as boolean)
          .onChange((value) => {
            void this.updatePluginSetting(
              key,
              value as PluginGlobalSettings[typeof key],
            );
          });
      });
      return;
    }

    setting.addText((text) => {
      text
        .setPlaceholder(field.placeholder?.(this.app.vault.getName()) ?? "")
        .setValue(this.plugin.settings[key] as string)
        .onChange((value) => {
          void this.updatePluginSetting(
            key,
            value as PluginGlobalSettings[typeof key],
          );
        });
    });
  }

  private async updatePluginSetting<K extends PluginSettingKey>(
    key: K,
    value: PluginGlobalSettings[K],
  ): Promise<void> {
    (this.plugin.settings as PluginGlobalSettings)[key] = value;
    await this.plugin.saveSettings();

    if (key === "useHomePage") {
      this.plugin.refreshExplorerBlocks();
      this.display();
    }
  }
}
