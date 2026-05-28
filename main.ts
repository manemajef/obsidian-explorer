import { Editor, MarkdownView, Plugin, TFile } from "obsidian";
import {
  normalizePluginSettings,
  parseSettings,
  PluginSettings,
} from "./src/explorer/settings";
import { renderExplorerBlock } from "./src/explorer";
import { ExplorerSettingsTab } from "./src/ui/settings-tab";
import {
  canGoToParentFolderNote,
  goToParentFolderNote,
  openHomePage,
} from "./src/explorer/navigation";
import { promptAndCreateFolder } from "./src/explorer/create";
import { togglePin } from "./src/explorer/file-utils";
import { registerHomePageNewTabs } from "./src/explorer/new-tab";

const FOLDERNOTE_TEMPLATE = "\n```explorer\n```\n";
type ExplorerRefresh = () => void;

export default class ExplorerPlugin extends Plugin {
  settings: PluginSettings;
  private explorerRefreshers = new Set<ExplorerRefresh>();

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new ExplorerSettingsTab(this.app, this));
    this.registerCommands();

    this.registerMarkdownCodeBlockProcessor(
      "explorer",
      async (source, el, ctx) => {
        await renderExplorerBlock(
          this.app,
          el,
          ctx,
          () => this.settings.defaultBlockSettings,
          () => this.settings,
          () => this.saveSettings(),
          parseSettings(source),
          (refresh) => this.registerExplorerRefresh(refresh),
        );
      },
    );
    registerHomePageNewTabs(this, () => this.settings);
    // const USE_FORCED_VIEW =
    //   !this.settings.defaultBlockSettings.forceReadingMode;
    this.registerEvent(
      this.app.workspace.on("file-open", async (file) => {
        if (!file) return;
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;
        // @ts-ignore
        if (this.app.vault.config.defaultViewMode === "preview") return;
        const leaf = view.leaf;
        const content = await this.app.vault.cachedRead(file);
        const hasExplorerBlock = content.includes("```explorer");

        if (
          !this.settings.defaultBlockSettings.forceReadingMode &&
          hasExplorerBlock
        ) {
          setTimeout(() => {
            if (view.editor) {
              view.editor.blur();
            }
          }, 10);
          return;
        }
        if (hasExplorerBlock) {
          console.log("has explorer view, setting view to preview");
          const state = leaf.getViewState();
          if (state.state && state.state.mode !== "preview")
            state.state.mode = "preview";
          await leaf.setViewState(state);
          console.log("set state to preview");
          // @ts-ignore
          leaf._explorerViewForcedPreview = true;
        }
        // @ts-ignore
        else if (leaf._explorerViewForcedPreview) {
          const state = leaf.getViewState();
          // @ts-ignore
          const defaultMode = this.app.vault.config.defaultViewMode || "source";
          // @ts-ignore
          if (state.state) state.state.mode = defaultMode;
          await leaf.setViewState(state);
          // @ts-ignore
          delete leaf._explorerViewForcedPreview;
        }
      }),
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

    this.addCommand({
      id: "go-to-homepage",
      name: "Go to homepage",
      checkCallback: (checking: boolean) => {
        if (!this.settings.useHomePage) {
          return false;
        }

        if (!checking) {
          const activeFile = this.app.workspace.getActiveFile();
          void openHomePage(this.app, this.settings, activeFile?.path ?? "");
        }

        return true;
      },
    });

    this.addCommand({
      id: "go-to-parent-folder",
      name: "Go to parent folder",
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();

        if (!canGoToParentFolderNote(this.app, this.settings, activeFile)) {
          return false;
        }

        if (!checking) {
          void goToParentFolderNote(this.app, this.settings, {
            currentFile: activeFile,
            savePluginSettings: () => this.saveSettings(),
          });
        }

        return true;
      },
    });

    this.addCommand({
      id: "toggle-pin",
      name: "Toggle pin for active note",
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();

        if (!activeFile || activeFile.extension !== "md") {
          return false;
        }

        if (!checking) {
          togglePin(this.app, activeFile);
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
    const separator =
      content.length === 0 || content.endsWith("\n") ? "" : "\n";
    await this.app.vault.modify(
      file,
      `${content}${separator}${FOLDERNOTE_TEMPLATE}`,
    );
  }

  async loadSettings(): Promise<void> {
    this.settings = normalizePluginSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  refreshExplorerBlocks(): void {
    for (const refresh of Array.from(this.explorerRefreshers)) {
      refresh();
    }
  }

  private registerExplorerRefresh(refresh: ExplorerRefresh): () => void {
    this.explorerRefreshers.add(refresh);
    return () => this.explorerRefreshers.delete(refresh);
  }
}
