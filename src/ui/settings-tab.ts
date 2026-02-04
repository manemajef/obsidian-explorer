import { App, PluginSettingTab, Setting } from "obsidian";
import ExplorerPlugin from "../../main";
import {
  BLOCK_SETTINGS_SCHEMA,
  BlockSettingKey,
  BlockSettings,
  SettingsSection,
  createDefaultPluginSettings,
  getEnumOptionLabel,
  getSettingKeysForSurface,
  getSettingLabel,
  getSettingSection,
} from "../settings/schema";

type SectionMeta = {
  title: string;
  description?: string;
};

const SECTION_ORDER: SettingsSection[] = [
  "core",
  "behavior",
  "display",
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
        this.renderField(containerEl, key, settings, fieldRefs);
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

  private renderField(
    container: HTMLElement,
    key: BlockSettingKey,
    settings: BlockSettings,
    fieldRefs: Map<BlockSettingKey, Setting>,
  ): void {
    const field = BLOCK_SETTINGS_SCHEMA[key];
    const setting = new Setting(container).setName(getSettingLabel(key, "plugin"));

    if (field.description) {
      setting.setDesc(field.description);
    }

    if (field.kind === "boolean") {
      setting.addToggle((toggle) => {
        toggle.setValue(settings[key] as boolean).onChange((value) => {
          void this.updateSetting(key, value as BlockSettings[typeof key]);
          if (key === "usePagination") {
            fieldRefs.get("pageSize")?.setDisabled(!value);
          }
        });
      });
    } else if (field.kind === "number") {
      setting.addSlider((slider) => {
        slider
          .setLimits(field.min, field.max, field.step ?? 1)
          .setValue(settings[key] as number)
          .setDynamicTooltip()
          .onChange((value) => {
            void this.updateSetting(key, value as BlockSettings[typeof key]);
          });
      });
    } else {
      setting.addDropdown((dropdown) => {
        for (const option of field.options) {
          dropdown.addOption(option, getEnumOptionLabel(key, option));
        }
        dropdown
          .setValue(settings[key] as string)
          .onChange((value) => {
            void this.updateSetting(key, value as BlockSettings[typeof key]);
          });
      });
    }

    if (key === "pageSize") {
      setting.setDisabled(!settings.usePagination);
    }

    fieldRefs.set(key, setting);
  }

  private async updateSetting<K extends keyof BlockSettings>(
    key: K,
    value: BlockSettings[K],
  ) {
    this.plugin.settings.defaultBlockSettings[key] = value;
    await this.plugin.saveSettings();
  }
}
