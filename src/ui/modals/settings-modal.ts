import { App, Modal, Setting } from "obsidian";
import {
  BLOCK_SETTINGS_SCHEMA,
  BlockSettingKey,
  BlockSettings,
  getEnumOptionLabel,
  getSettingKeysForSurface,
  getSettingLabel,
} from "../../settings/schema";

// Per-block settings UI (applies to a single explorer code block).
export class ExplorerSettingsModal extends Modal {
  settings: BlockSettings;
  onSettingsChange: (settings: BlockSettings) => void;

  constructor(
    app: App,
    settings: BlockSettings,
    onSettingsChange: (settings: BlockSettings) => void,
  ) {
    super(app);
    this.settings = { ...settings };
    this.onSettingsChange = onSettingsChange;
  }

  private updateSetting<K extends keyof BlockSettings>(
    key: K,
    value: BlockSettings[K],
  ): void {
    this.settings[key] = value;
    this.onSettingsChange(this.settings);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("explorer-settings-modal");

    new Setting(contentEl).setName("Explorer settings").setHeading();

    const keys = getSettingKeysForSurface("block");
    const fieldRefs = new Map<BlockSettingKey, Setting>();

    for (const key of keys) {
      this.renderField(contentEl, key, fieldRefs);
    }

    new Setting(contentEl).addButton((button) => {
      button.setButtonText("Close").setCta().onClick(() => this.close());
    });
  }

  private renderField(
    container: HTMLElement,
    key: BlockSettingKey,
    fieldRefs: Map<BlockSettingKey, Setting>,
  ): void {
    const field = BLOCK_SETTINGS_SCHEMA[key];
    const setting = new Setting(container).setName(getSettingLabel(key, "block"));

    if (field.description) {
      setting.setDesc(field.description);
    }

    if (field.kind === "boolean") {
      setting.addToggle((toggle) => {
        toggle.setValue(this.settings[key] as boolean).onChange((value) => {
          this.updateSetting(key, value as BlockSettings[typeof key]);
          if (key === "usePagination") {
            fieldRefs.get("pageSize")?.setDisabled(!value);
          }
        });
      });
    } else if (field.kind === "number") {
      setting.addSlider((slider) => {
        slider
          .setLimits(field.min, field.max, field.step ?? 1)
          .setValue(this.settings[key] as number)
          .setDynamicTooltip()
          .onChange((value) => {
            this.updateSetting(key, value as BlockSettings[typeof key]);
          });
      });
    } else {
      setting.addDropdown((dropdown) => {
        for (const option of field.options) {
          dropdown.addOption(option, getEnumOptionLabel(key, option));
        }

        dropdown
          .setValue(this.settings[key] as string)
          .onChange((value) => {
            this.updateSetting(key, value as BlockSettings[typeof key]);
          });
      });
    }

    if (key === "pageSize") {
      setting.setDisabled(!this.settings.usePagination);
    }

    fieldRefs.set(key, setting);
  }

  onClose() {
    this.contentEl.empty();
  }
}
