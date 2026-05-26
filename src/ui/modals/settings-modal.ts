import { App, Modal, Setting } from "obsidian";
import {
  BlockSettingKey,
  BlockSettings,
  getSettingKeysForSurface,
} from "../../explorer/settings";
import { renderSettingField } from "../render-setting-field";

// Per-block settings UI (applies to a single explorer code block).
export class ExplorerSettingsModal extends Modal {
  settings: BlockSettings;
  onSettingsChange: (settings: BlockSettings) => void;

  constructor(
    app: App,
    settings: BlockSettings,
    private readonly sourcePath: string,
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
      renderSettingField(
        contentEl,
        key,
        this.settings,
        "block",
        (k, v) => this.updateSetting(k, v),
        fieldRefs,
        { app: this.app, sourcePath: this.sourcePath },
      );
    }

    new Setting(contentEl).addButton((button) => {
      button.setButtonText("Close").setCta().onClick(() => this.close());
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}
