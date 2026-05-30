import { App, ItemView, TFile, TFolder, WorkspaceLeaf } from "obsidian";
import type { ViewStateResult } from "obsidian";
import { BlockSettings, PluginSettings } from "./settings";
import {
  createFolderNoteFile,
  getFolderNoteForFolder,
  getFolderNotePath,
} from "./folder-note-data";
import { mountExplorer } from "../explorer";
import { formatExplorerBlock } from "./vault/block-update";

export const VIRTUAL_FOLDER_NOTE_VIEW_TYPE = "explorer-virtual-folder-note";

export type VirtualFolderNoteHost = {
  getBlockDefaults: () => BlockSettings;
  getPluginSettings: () => PluginSettings;
  savePluginSettings: () => void | Promise<void>;
  registerRefresh?: (refresh: () => void) => () => void;
};

export async function openVirtualFolderNote(
  app: App,
  folder: TFolder,
  newLeaf = false,
): Promise<void> {
  const leaf = app.workspace.getLeaf(newLeaf);
  await leaf.setViewState({
    type: VIRTUAL_FOLDER_NOTE_VIEW_TYPE,
    active: true,
    state: {
      folderPath: folder.path,
    },
  });
  app.workspace.setActiveLeaf(leaf, { focus: true });
}

export class VirtualFolderNoteView extends ItemView {
  private state = { folderPath: "" };
  private cleanupExplorer: (() => void) | null = null;

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
  }

  protected async onOpen(): Promise<void> {
    await this.render();
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

  private async render(): Promise<void> {
    this.cleanupExplorer?.();
    this.cleanupExplorer = null;
    this.contentEl.empty();
    this.contentEl.addClass("explorer-virtual-folder-note");

    const folder = this.folder;
    if (!folder) {
      this.contentEl.createDiv({
        cls: "explorer-virtual-folder-note-missing",
        text: "Folder not found",
      });
      return;
    }

    const preview = this.contentEl.createDiv({
      cls: "markdown-preview-view markdown-rendered",
    });
    preview.setAttr("data-path", this.sourcePath);
    const section = preview.createDiv({
      cls: "markdown-preview-sizer markdown-preview-section",
    });

    this.renderBreadcrumbs(section, folder);
    section.createDiv({ cls: "inline-title", text: folder.name });
    const explorerContainer = section.createDiv();

    this.cleanupExplorer = await mountExplorer({
      app: this.app,
      container: explorerContainer,
      sourcePath: this.sourcePath,
      sourceFolder: folder,
      getBlockDefaults: this.host.getBlockDefaults,
      getPluginSettings: this.host.getPluginSettings,
      savePluginSettings: this.host.savePluginSettings,
      initialOverrides: {},
      registerRefresh: this.host.registerRefresh,
      replaceExplorerBlock: async (settings) => {
        const file = await this.writeFolderNoteBlock(
          folder,
          formatExplorerBlock(settings, this.host.getBlockDefaults()),
        );
        if (file) {
          await this.app.workspace.openLinkText(
            file.path,
            this.sourcePath,
            false,
          );
        }
      },
    });
  }

  private async writeFolderNoteBlock(
    folder: TFolder,
    content: string,
  ): Promise<TFile | null> {
    const existing = getFolderNoteForFolder(this.app, folder);
    if (!existing) return createFolderNoteFile(this.app, folder, content);
    await this.app.vault.modify(existing, content);
    return existing;
  }

  private renderBreadcrumbs(container: HTMLElement, folder: TFolder): void {
    const ancestors: TFolder[] = [];
    for (let current: TFolder | null = folder; current && !current.isRoot();) {
      ancestors.unshift(current);
      current = current.parent;
    }

    if (ancestors.length <= 1) return;

    const breadcrumbs = container.createDiv({
      cls: "explorer-virtual-breadcrumbs",
    });

    ancestors.forEach((ancestor, index) => {
      if (index > 0) {
        breadcrumbs.createSpan({
          cls: "explorer-virtual-breadcrumb-separator",
          text: "/",
        });
      }
      const link = breadcrumbs.createEl("a", {
        cls: "internal-link",
        text: ancestor.name,
        href: getFolderNotePath(ancestor),
      });
      link.setAttr("data-href", getFolderNotePath(ancestor));
      link.addEventListener("click", (event) => {
        event.preventDefault();
        void this.openFolder(ancestor, event.ctrlKey || event.metaKey);
      });
    });
  }

  private async openFolder(folder: TFolder, newLeaf: boolean): Promise<void> {
    const existing = getFolderNoteForFolder(this.app, folder);
    if (!existing) {
      await openVirtualFolderNote(this.app, folder, newLeaf);
      return;
    }

    await this.app.workspace.openLinkText(
      existing.path,
      this.sourcePath,
      newLeaf,
    );
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
