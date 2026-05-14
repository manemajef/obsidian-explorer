import { Editor, MarkdownView, Plugin, TFile } from "obsidian";
import {
  normalizePluginSettings,
  PluginSettings,
  resolveBlockSettings,
} from "./src/settings/schema";
import { renderExplorerBlock } from "./src/explorer";
import { parseSettings } from "./src/settings/block-parser";
import { ExplorerSettingsTab } from "./src/ui/settings-tab";
import { promptAndCreateFolder } from "./src/vault/actions";

const FOLDERNOTE_TEMPLATE = "\n```explorer\n```\n";

export default class ExplorerPlugin extends Plugin {
  settings: PluginSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new ExplorerSettingsTab(this.app, this));
    this.registerCommands();

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

  private registerCommands(): void {
    this.addCommand({
      id: "insetrt-code-block",
      name: "Insert code block",
      checkCallback: (checking: boolean) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const file = view?.file;

        if (!view || !(file instanceof TFile)) {
          return false;
        }

        if (!checking) {
          void this.insertExplorerCodeBlock(view, file);
        }

        return true;
      },
    });

    this.addCommand({
      id: "create-folder-in-current-folder",
      name: "Create folder in current note folder",
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();
        const basePath = activeFile?.parent?.path;

        if (!activeFile || !basePath) {
          return false;
        }

        if (!checking) {
          void promptAndCreateFolder(this.app, basePath);
        }

        return true;
      },
    });
  }

  private async insertExplorerCodeBlock(
    view: MarkdownView,
    file: TFile,
  ): Promise<void> {
    const mode = view.getMode?.();
    const editor = mode !== "preview" ? view.editor : null;

    if (editor) {
      this.insertExplorerCodeBlockAtCursor(editor);
      return;
    }

    await this.appendExplorerCodeBlockToFile(file);
  }

  private insertExplorerCodeBlockAtCursor(editor: Editor): void {
    editor.replaceRange(FOLDERNOTE_TEMPLATE, editor.getCursor());
  }

  private async appendExplorerCodeBlockToFile(file: TFile): Promise<void> {
    const content = await this.app.vault.read(file);
    const separator = content.length === 0 || content.endsWith("\n") ? "" : "\n";
    await this.app.vault.modify(file, `${content}${separator}${FOLDERNOTE_TEMPLATE}`);
  }

  async loadSettings(): Promise<void> {
    this.settings = normalizePluginSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
