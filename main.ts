import { Editor, MarkdownView, Plugin, TFile } from "obsidian";
import {
  normalizePluginSettings,
  PluginSettings,
} from "./src/settings/schema";
import { ExplorerBridge } from "./src/plugin/explorer";
import { ExplorerAPI } from "./src/backend/explorer-api";
import { ExplorerSettingsTab } from "./src/ui/settings-tab";
import { FOLDERNOTE_TEMPLATE } from "./src/constants";

export default class ExplorerPlugin extends Plugin {
  settings: PluginSettings;
  private api!: ExplorerAPI;

  async onload() {
    await this.loadSettings();
    this.api = new ExplorerAPI(this.app);
    this.addSettingTab(new ExplorerSettingsTab(this.app, this));
    this.registerCommands();

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

  private registerCommands(): void {
    this.addCommand({
      id: "insert-explorer-code-block",
      name: "Insert explorer code block",
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
      id: "create-explorer-folder-in-current-folder",
      name: "Create explorer folder in current note folder",
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();
        const basePath = activeFile?.parent?.path;

        if (!activeFile || !basePath) {
          return false;
        }

        if (!checking) {
          void this.api.promptAndCreateFolder(basePath);
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
