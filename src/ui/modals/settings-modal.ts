import { App, Modal, Setting } from "obsidian";
import {
  BlockSettingKey,
  BlockSettings,
  getSettingKeysForSurface,
  isBlockSettingVisible,
} from "../../explorer/settings";
import { renderSettingField } from "../render-setting-field";

export type FolderNoteConversionAction = {
  isFile: boolean;
  run: () => void | Promise<void>;
};

// Per-block settings UI (applies to a single explorer code block).
export class ExplorerSettingsModal extends Modal {
  settings: BlockSettings;
  onSettingsChange: (settings: BlockSettings) => void;

  constructor(
    app: App,
    settings: BlockSettings,
    private readonly sourcePath: string,
    onSettingsChange: (settings: BlockSettings) => void,
    private readonly conversion?: FolderNoteConversionAction,
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
    if (key === "view") {
      this.onOpen();
    }
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("explorer-settings-modal");

    new Setting(contentEl).setName("Explorer settings").setHeading();

    const keys = getSettingKeysForSurface("block").filter((key) =>
      isBlockSettingVisible(key, this.settings),
    );
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

    this.renderConversion(contentEl);

    new Setting(contentEl).addButton((button) => {
      button
        .setButtonText("Close")
        .setCta()
        .onClick(() => this.close());
    });
  }

  private renderConversion(contentEl: HTMLElement): void {
    if (!this.conversion) return;
    const { isFile } = this.conversion;

    new Setting(contentEl)
      .setName(isFile ? "Markdown file" : "No file")
      .setDesc(
        isFile
          ? "Remove the Markdown file but keep this folder note and its settings."
          : "Create a Markdown file for this folder note so you can write text in it.",
      )
      .addButton((button) => {
        button
          .setButtonText(isFile ? "Remove file" : "Add file")
          .onClick(async () => {
            await this.conversion?.run();
            this.close();
          });
        if (isFile) button.setWarning();
      });
  }

  onClose() {
    this.contentEl.empty();
  }
}
