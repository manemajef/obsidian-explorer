import {
  App,
  normalizePath,
  ItemView,
  Notice,
  TAbstractFile,
  TFile,
  TFolder,
  WorkspaceLeaf,
} from "obsidian";
import type { IconName, ViewStateResult } from "obsidian";
import {
  BlockSettings,
  PluginSettings,
  coercePartialBlockSettings,
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
import { getHomePageInlineTitleConfig } from "../navigation/homepage";
import { isHTMLElement } from "../../utils";
import { ConfirmationDialog } from "../../ui/modals/prompt-modal";

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

type VirtualFolderNoteState = {
  folderPath: string;
  sourcePath?: string;
  title?: string;
  initialOverrides?: Partial<BlockSettings>;
};

type InlineTitle = {
  text: string;
  onSave?: (nextTitle: string) => Promise<boolean | void>;
};

export class VirtualFolderNoteView extends ItemView {
  private state: VirtualFolderNoteState = { folderPath: "" };
  private cleanupExplorer: (() => void) | null = null;
  private isRenameTrackingRegistered = false;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly host: VirtualFolderNoteHost,
  ) {
    super(leaf);
    this.navigation = true;
    this.icon = this.getIcon();
  }

  get folder(): TFolder | null {
    if (this.state.folderPath === "") return this.app.vault.getRoot();
    const folder = this.app.vault.getAbstractFileByPath(this.state.folderPath);
    return folder instanceof TFolder ? folder : null;
  }

  get sourcePath(): string {
    const folder = this.folder;
    return this.state.sourcePath ?? (folder ? getFolderNotePath(folder) : "");
  }

  getViewType(): string {
    return VIRTUAL_FOLDER_NOTE_VIEW_TYPE;
  }

  getIcon(): IconName {
    return this.isHomePage() ? "home" : "folder";
  }

  getDisplayText(): string {
    return this.getTitle(this.folder);
  }

  getState(): Record<string, unknown> {
    return { ...this.state };
  }

  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    void result;
    this.state = this.normalizeState(state);
    this.icon = this.getIcon();
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

  private normalizeState(state: unknown): VirtualFolderNoteState {
    return {
      folderPath:
        isRecord(state) && typeof state.folderPath === "string"
          ? state.folderPath
          : "",
      sourcePath:
        isRecord(state) && typeof state.sourcePath === "string"
          ? state.sourcePath
          : undefined,
      title:
        isRecord(state) && typeof state.title === "string"
          ? state.title
          : undefined,
      initialOverrides:
        isRecord(state) && isRecord(state.initialOverrides)
          ? coercePartialBlockSettings(state.initialOverrides)
          : undefined,
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
      this.state = { ...this.state, folderPath: file.path };
    } else if (this.state.folderPath.startsWith(`${oldPath}/`)) {
      this.state = {
        ...this.state,
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
    const inlineTitle = this.getInlineTitle(folder);
    const title = titleContainer.createDiv({
      cls: "inline-title",
      text: inlineTitle.text,
    });
    if (inlineTitle.onSave) {
      this.makeInlineTitleEditable(title, inlineTitle.text, inlineTitle.onSave);
    }

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
      initialOverrides: {
        ...this.state.initialOverrides,
        ...this.host.getFolderData(folder.path),
      },
      registerRefresh: this.host.registerRefresh,
      onSaveFolderNote: () => this.materialize(),
      folderNote: { isFile: false, convert: () => this.materialize() },
      removeFolderNoteFile: this.host.removeFolderNoteFile,
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
      {
        ...this.state.initialOverrides,
        ...this.host.getFolderData(folder.path),
      },
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
    if (this.state.sourcePath) {
      return this.writeExplicitVirtualNote(content);
    }

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

  private async writeExplicitVirtualNote(
    content: string,
  ): Promise<TFile | null> {
    const path = this.state.sourcePath;
    if (!path) return null;

    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, content);
      return existing;
    }
    if (existing) {
      new Notice(`Virtual note path is not a note: ${path}`);
      return null;
    }

    if (!(await this.confirmVirtualNoteCreation(path))) return null;

    try {
      return await this.app.vault.create(path, content);
    } catch (err) {
      new Notice(`Failed to create note: ${err}`);
      return null;
    }
  }

  private confirmVirtualNoteCreation(path: string): Promise<boolean> {
    const settings = this.host.getPluginSettings();
    if (!settings.askForFolderNoteCreation) return Promise.resolve(true);

    return new Promise((resolve) => {
      new ConfirmationDialog(
        this.app,
        "Create Markdown note?",
        () => resolve(true),
        async () => {
          settings.askForFolderNoteCreation = false;
          await this.host.savePluginSettings();
        },
        `The note "${path}" doesn't exist yet. Pressing Confirm will create a new Markdown note for it.`,
        () => resolve(false),
      ).open();
    });
  }

  private queueHeaderTitleUpdate(): void {
    const win = this.containerEl.ownerDocument.defaultView ?? window;
    win.requestAnimationFrame(() => this.updateHeaderTitle(this.folder));
  }

  private getTitle(folder: TFolder | null): string {
    return this.state.title || folder?.name || "Folder note";
  }

  private isHomePage(): boolean {
    return Boolean(this.state.title && this.state.sourcePath);
  }

  private getInlineTitle(folder: TFolder): InlineTitle {
    if (this.isHomePage()) {
      const title = getHomePageInlineTitleConfig({
        app: this.app,
        leaf: this.leaf,
        settings: this.host.getPluginSettings(),
        saveSettings: this.host.savePluginSettings,
        updateVirtualState: (state) => {
          this.state = { ...this.state, ...state };
          this.icon = this.getIcon();
          void this.render().then(() => this.queueHeaderTitleUpdate());
        },
      });
      return {
        text: title.value,
        onSave: title.onSave,
      };
    }

    if (folder.isRoot() || !this.host.getPluginSettings().syncFolderNotes) {
      return { text: this.getTitle(folder) };
    }

    return {
      text: this.getTitle(folder),
      onSave: (nextTitle) => this.renameFolderFromTitle(nextTitle, folder),
    };
  }

  private makeInlineTitleEditable(
    title: HTMLElement,
    savedTitle: string,
    onSave: (nextTitle: string) => Promise<boolean | void>,
  ): void {
    let cancelled = false;
    title.setAttr("contenteditable", "true");
    title.setAttr("spellcheck", "false");
    title.setAttr("role", "textbox");
    title.setAttr("aria-label", "Title");

    title.addEventListener("focus", () => {
      cancelled = false;
    });
    title.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        title.blur();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        cancelled = true;
        title.setText(savedTitle);
        title.blur();
      }
    });
    title.addEventListener("blur", () => {
      if (cancelled) return;
      void this.saveInlineTitle(title, savedTitle, onSave);
    });
  }

  private async saveInlineTitle(
    title: HTMLElement,
    savedTitle: string,
    onSave: (nextTitle: string) => Promise<boolean | void>,
  ): Promise<void> {
    const nextTitle = (title.textContent ?? "").trim();
    if (nextTitle === savedTitle) return;
    try {
      if ((await onSave(nextTitle)) === false) title.setText(savedTitle);
    } catch (error) {
      title.setText(savedTitle);
      new Notice(`Could not update title: ${error}`);
    }
  }

  private async renameFolderFromTitle(
    nextName: string,
    folder: TFolder,
  ): Promise<boolean> {
    if (nextName === folder.name) return true;

    const parent = folder.parent;
    if (
      !parent ||
      !nextName ||
      nextName.includes("/") ||
      nextName.includes("\\")
    ) {
      if (!nextName) new Notice("Folder name cannot be empty.");
      else new Notice("Folder name cannot contain slashes.");
      return false;
    }

    const destinationPath = normalizePath(`${parent.path}/${nextName}`);
    try {
      await this.app.fileManager.renameFile(folder, destinationPath);
      return true;
    } catch (error) {
      new Notice(`Could not rename folder: ${error}`);
      return false;
    }
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
    if (this.state.title) {
      title.createSpan({ text: this.state.title });
      return;
    }

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
