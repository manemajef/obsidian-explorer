import { App, PluginSettingTab, Setting } from "obsidian";
import ExplorerPlugin from "../../main";
import {
  BlockSettingKey,
  BlockSettings,
  PLUGIN_SETTINGS_SCHEMA,
  PluginGlobalSettings,
  PluginSettingKey,
  SETTING_SECTIONS,
  createDefaultPluginSettings,
  getPluginSettingKeysForSection,
  getSettingKeysForSurface,
  getSettingSection,
  isBlockSettingVisible,
  isPluginSettingVisible,
} from "../explorer/settings";
import {
  renderFolderPickerControl,
  renderSettingField,
} from "./render-setting-field";
import { isHomePageNewTabManagedElsewhere } from "../explorer/navigation/homepage";

function compareBySection(
  a: BlockSettingKey,
  b: BlockSettingKey,
): number {
  const aSection = getSettingSection(a);
  const bSection = getSettingSection(b);
  const sectionDiff =
    SETTING_SECTIONS.findIndex((s) => s.id === aSection) -
    SETTING_SECTIONS.findIndex((s) => s.id === bSection);

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
    const defaultBlockKeys = getSettingKeysForSurface("plugin")
      .filter((key) => isBlockSettingVisible(key, settings))
      .sort((a, b) => compareBySection(a, b));
    const fieldRefs = new Map<BlockSettingKey, Setting>();

    for (const section of SETTING_SECTIONS) {
      const sectionKeys = getPluginSettingKeysForSection(section.id).filter(
        (key) => isPluginSettingVisible(key, this.plugin.settings),
      );
      if (sectionKeys.length === 0) {
        continue;
      }

      new Setting(containerEl).setName(section.title).setHeading();
      if (section.description) {
        containerEl.createEl("p", {
          text: section.description,
          cls: "setting-item-description",
        });
      }

      for (const key of sectionKeys) {
        this.renderPluginSetting(containerEl, key);
      }
    }

    if (defaultBlockKeys.length > 0) {
      const coreSection = SETTING_SECTIONS.find((s) => s.id === "core")!;
      new Setting(containerEl).setName(coreSection.title).setHeading();
      if (coreSection.description) {
        containerEl.createEl("p", {
          text: coreSection.description,
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
    if (key === "view") {
      this.display();
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

    if (field.kind === "enum") {
      setting.addDropdown((dropdown) => {
        const optionLabels: Partial<Record<string, string>> =
          field.optionLabels ?? {};
        for (const option of field.options) {
          dropdown.addOption(option, optionLabels[option] ?? option);
        }
        dropdown
          .setValue(this.plugin.settings[key] as string)
          .onChange((value) => {
            void this.updatePluginSetting(
              key,
              value as PluginGlobalSettings[typeof key],
            );
          });
      });
      return;
    }

    if (field.kind === "folder-picker") {
      this.renderPluginFolderPicker(containerEl, setting, key);
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

  private renderPluginFolderPicker(
    containerEl: HTMLElement,
    setting: Setting,
    key: PluginSettingKey,
  ): void {
    const field = PLUGIN_SETTINGS_SCHEMA[key];
    if (field.kind !== "folder-picker") return;

    const availableFolders = this.app.vault
      .getAllFolders()
      .map((folder) => folder.path)
      .filter((path) => path !== "/")
      .sort((a, b) => a.localeCompare(b));

    renderFolderPickerControl(containerEl, setting, {
      app: this.app,
      value: this.plugin.settings[key] as string[],
      availableFolders,
      placeholder: "Vault root",
      selectedContainerClass: "explorer-plugin-folder-picker",
      single: true,
      renderSelected: false,
      normalizeInput: (path) => path.trim().replace(/^\/+|\/+$/g, ""),
      onChange: (paths) => {
        void this.updatePluginSetting(
          key,
          paths as PluginGlobalSettings[typeof key],
        );
      },
    });
  }

  private async updatePluginSetting<K extends PluginSettingKey>(
    key: K,
    value: PluginGlobalSettings[K],
  ): Promise<void> {
    (this.plugin.settings as PluginGlobalSettings)[key] = value;
    await this.plugin.saveSettings();

    this.plugin.refreshExplorerBlocks();

    if (key === "useHomePage" || key === "hideFolderNotesInFileExplorer") {
      this.display();
    }
  }
}
