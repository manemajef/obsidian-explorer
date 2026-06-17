import {
  App,
  ItemView,
  TAbstractFile,
  TFile,
  TFolder,
  WorkspaceLeaf,
} from "obsidian";
import type { ViewStateResult } from "obsidian";
import {
  BlockSettings,
  PluginSettings,
  getBlockSettingsOverrides,
  resolveBlockSettings,
} from "../settings";
import {
  createFolderNoteFileWithConfirmation,
  getFolderNoteForFolder,
  getFolderNotePath,
} from "../lib/folder-note";
import { mountExplorer } from "../runtime";
import { formatExplorerBlock } from "../vault/block-update";
import { VIRTUAL_FOLDER_NOTE_VIEW_TYPE } from "../navigation/virtual-folder-note";
import { isHTMLElement } from "../../utils";

export { VIRTUAL_FOLDER_NOTE_VIEW_TYPE } from "../navigation/virtual-folder-note";

export type VirtualFolderNoteHost = {
  getBlockDefaults: () => BlockSettings;
  getPluginSettings: () => PluginSettings;
  savePluginSettings: () => void | Promise<void>;
  registerRefresh?: (refresh: () => void) => () => void;
  refreshTitlebarActions?: () => void;
  getFolderData: (folderPath: string) => Partial<BlockSettings>;
  setFolderData: (
    folderPath: string,
    overrides: Partial<BlockSettings>,
  ) => void;
  deleteFolderData: (folderPath: string) => void;
  removeFolderNoteFile?: (file: TFile) => void | Promise<void>;
};

export class VirtualFolderNoteView extends ItemView {
  private state = { folderPath: "" };
  private cleanupExplorer: (() => void) | null = null;
  private isRenameTrackingRegistered = false;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly host: VirtualFolderNoteHost,
  ) {
    super(leaf);
    this.navigation = true;
    this.icon = "folder";
  }

  get folder(): TFolder | null {
    const folder = this.app.vault.getAbstractFileByPath(this.state.folderPath);
    return folder instanceof TFolder ? folder : null;
  }

  get sourcePath(): string {
    const folder = this.folder;
    return folder ? getFolderNotePath(folder) : "";
  }

  getViewType(): string {
    return VIRTUAL_FOLDER_NOTE_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.folder?.name ?? "Folder note";
  }

  getState(): Record<string, unknown> {
    return { ...this.state };
  }

  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    void result;
    this.state = this.normalizeState(state);
    await this.render();
    this.queueHeaderTitleUpdate();
  }

  protected async onOpen(): Promise<void> {
    this.registerRenameTracking();
    await this.render();
    this.queueHeaderTitleUpdate();
  }

  protected async onClose(): Promise<void> {
    this.cleanupExplorer?.();
    this.cleanupExplorer = null;
  }

  private normalizeState(state: unknown): { folderPath: string } {
    return {
      folderPath:
        isRecord(state) && typeof state.folderPath === "string"
          ? state.folderPath
          : "",
    };
  }

  private registerRenameTracking(): void {
    if (this.isRenameTrackingRegistered) return;
    this.isRenameTrackingRegistered = true;
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        void this.handleRename(file, oldPath);
      }),
    );
  }

  private async handleRename(
    file: TAbstractFile,
    oldPath: string,
  ): Promise<void> {
    if (!(file instanceof TFolder)) return;
    if (this.state.folderPath === oldPath) {
      this.state = { folderPath: file.path };
    } else if (this.state.folderPath.startsWith(`${oldPath}/`)) {
      this.state = {
        folderPath: `${file.path}${this.state.folderPath.slice(oldPath.length)}`,
      };
    } else {
      return;
    }
    await this.render();
    this.queueHeaderTitleUpdate();
  }

  private async render(): Promise<void> {
    this.cleanupExplorer?.();
    this.cleanupExplorer = null;
    this.contentEl.empty();
    this.contentEl.addClass("explorer-virtual-folder-note-container");
    const folder = this.folder;
    if (!folder) {
      const readingView = this.contentEl.createDiv({
        cls: "markdown-reading-view",
      });
      const mainView = readingView.createDiv({
        cls: "explorer-virtual-folder-note markdown-preview-view markdown-rendered is-readable-line-width",
      });
      mainView.createDiv({
        cls: "explorer-virtual-folder-note-missing",
        text: "Folder not found",
      });
      this.updateHeaderTitle(null);
      return;
    }
    this.updateHeaderTitle(folder);

    const readingView = this.contentEl.createDiv({
      cls: "markdown-reading-view",
    });
    const mainView = readingView.createDiv({
      cls: "explorer-virtual-folder-note markdown-preview-view markdown-rendered is-readable-line-width",
    });
    mainView.setAttr("data-path", this.sourcePath);
    const section = mainView.createDiv({
      cls: "markdown-preview-sizer markdown-preview-section",
    });

    const titleContainer = section.createDiv({
      cls: "virtual-folder-title-container",
    });
    titleContainer.createDiv({ cls: "inline-title", text: folder.name });
    // titleContainer.createDiv({
    //   cls: "virtual-folder-warning",
    //   text: "Save folder note",
    // });

    // Create explicit action bar container (no slot injection needed)
    const actionBarContainer = section.createDiv({
      cls: "explorer-container explorer-action-bar-host",
    });

    const explorerContainer = section.createDiv();
    section.createDiv({
      cls: "virtual-folder-margin-bottom",
    });
    this.cleanupExplorer = await mountExplorer({
      app: this.app,
      container: explorerContainer,
      sourcePath: this.sourcePath,
      sourceFolder: folder,
      getBlockDefaults: this.host.getBlockDefaults,
      getPluginSettings: this.host.getPluginSettings,
      savePluginSettings: this.host.savePluginSettings,
      initialOverrides: this.host.getFolderData(folder.path),
      registerRefresh: this.host.registerRefresh,
      onSaveFolderNote: () => this.materialize(),
      folderNote: { isFile: false, convert: () => this.materialize() },
      removeFolderNoteFile: this.host.removeFolderNoteFile,
      actionBarContainer, // Provide explicit container instead of using slot system
      replaceExplorerBlock: async (settings) => {
        // Changing a per-view setting on a file-free note always persists to
        // the data store — it never silently creates a file. Use the "Add file"
        // action (materialize) to create a Markdown folder note explicitly.
        this.host.setFolderData(
          folder.path,
          getBlockSettingsOverrides(settings, this.host.getBlockDefaults()),
        );
        this.host.refreshTitlebarActions?.();
      },
    });
  }

  /**
   * Turns a virtual folder note into a real Markdown one, carrying over any
   * stored overrides into the block and dropping the now-redundant data row.
   */
  async materialize(): Promise<void> {
    const folder = this.folder;
    if (!folder) return;

    const defaults = this.host.getBlockDefaults();
    const settings = resolveBlockSettings(
      defaults,
      this.host.getFolderData(folder.path),
    );
    const file = await this.writeFolderNoteBlock(
      folder,
      formatExplorerBlock(settings, defaults),
    );
    if (!file) return;

    this.host.deleteFolderData(folder.path);
    await this.app.workspace.openLinkText(file.path, this.sourcePath, false);
  }

  private async writeFolderNoteBlock(
    folder: TFolder,
    content: string,
  ): Promise<TFile | null> {
    const existing = getFolderNoteForFolder(this.app, folder);
    if (!existing) {
      return createFolderNoteFileWithConfirmation(
        this.app,
        folder,
        this.host.getPluginSettings(),
        this.host.savePluginSettings,
        content,
      );
    }
    await this.app.vault.modify(existing, content);
    return existing;
  }

  private queueHeaderTitleUpdate(): void {
    const win = this.containerEl.ownerDocument.defaultView ?? window;
    win.requestAnimationFrame(() => this.updateHeaderTitle(this.folder));
  }

  private updateHeaderTitle(folder: TFolder | null): void {
    const titleContainer =
      this.containerEl.querySelector(".view-header-title-container") ??
      this.containerEl
        .closest(".workspace-leaf-content")
        ?.querySelector(".view-header-title-container");
    if (!isHTMLElement(titleContainer)) return;

    titleContainer.empty();
    titleContainer.addClass("explorer-virtual-title-container");

    const title = titleContainer.createDiv({
      cls: "view-header-title explorer-virtual-title",
    });
    const parts = folder?.path.split("/").filter(Boolean) ?? [];
    if (parts.length === 0) {
      title.createSpan({ text: "Folder note" });
      return;
    }

    parts.forEach((part, index) => {
      if (index > 0) {
        title.createSpan({
          cls: "explorer-virtual-title-separator",
          text: "/",
        });
      }
      title.createSpan({
        cls: "explorer-virtual-title-part",
        text: part,
      });
    });
  }
}

export function getActiveVirtualFolderNote(
  app: App,
): VirtualFolderNoteView | null {
  return app.workspace.getActiveViewOfType(VirtualFolderNoteView);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
