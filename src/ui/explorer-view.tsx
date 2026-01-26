import React from "react";
import { createRoot, Root } from "react-dom/client";
import {
  App,
  MarkdownPostProcessorContext,
  TFile,
  TFolder,
} from "obsidian";
import { ExplorerSettings } from "../types";
import { isRtl } from "../utils/helpers";
import { FolderIndex, GetAllContentOptions } from "../services/folder-index";
import {
  createFolderWithNote,
  createNewNote,
  updateExplorerBlock,
} from "../services/explorer-actions";

import { ExplorerSettingsModal } from "./modals/settings-modal";
import { PromptModal } from "./modals/prompt-modal";
import { ExplorerUI } from "./explorer-ui";
export class ExplorerView {
  app: App;
  container: HTMLElement;
  effectiveSettings: ExplorerSettings;
  ctx: MarkdownPostProcessorContext;
  sourcePath: string;

  private folderIndex: FolderIndex | null = null;
  private currentFolder: TFolder | null = null;
  private reactRoot: Root | null = null;
  private depthFiles: TFile[] = [];

  constructor(
    app: App,
    container: HTMLElement,
    effectiveSettings: ExplorerSettings,
    ctx: MarkdownPostProcessorContext,
  ) {
    this.app = app;
    this.container = container;
    this.effectiveSettings = effectiveSettings;
    this.ctx = ctx;
    this.sourcePath = ctx.sourcePath;
  }

  async render(): Promise<void> {
    this.container.addClass("explorer-container");
    this.container.classList.toggle(
      "use-glass",
      this.effectiveSettings.useGlass,
    );

    const blockFile = this.app.vault.getAbstractFileByPath(this.sourcePath);
    if (!(blockFile instanceof TFile) || !blockFile.parent) {
      this.renderEmpty("No active file or folder");
      return;
    }

    const folder = blockFile.parent;
    this.currentFolder = folder;
    this.container.setAttribute("dir", isRtl() ? "rtl" : "ltr");

    this.folderIndex = new FolderIndex(this.app, folder);
    await this.folderIndex.loadToDepth(this.effectiveSettings.depth);
    this.depthFiles = this.folderIndex.getFilesToDisplay(this.effectiveSettings);

    this.renderWithIndex();
  }

  private renderEmpty(message: string): void {
    this.renderReact(<p>{message}</p>);
  }

  private renderReact(node: React.ReactElement): void {
    if (!this.reactRoot) {
      this.reactRoot = createRoot(this.container);
    }
    this.reactRoot.render(node);
  }

  private renderWithIndex(): void {
    if (!this.folderIndex || !this.currentFolder) return;

    this.renderReact(
      <ExplorerUI
        app={this.app}
        sourcePath={this.sourcePath}
        folder={this.currentFolder}
        effectiveSettings={this.effectiveSettings}
        folderInfos={this.folderIndex.folders}
        depthFiles={this.depthFiles}
        folderNotes={this.folderIndex.folderNotes}
        getAllFiles={(options?: GetAllContentOptions) =>
          this.folderIndex
            ? this.folderIndex.getAllContent(options)
            : Promise.resolve([])
        }
        onOpenSettings={() => this.openSettings()}
        onNewFolder={() => this.promptNewFolder(this.currentFolder?.path || "")}
        onNewNote={() => this.createNewNote(this.currentFolder?.path || "")}
      />,
    );
  }

  private openSettings(): void {
    new ExplorerSettingsModal(
      this.app,
      this.effectiveSettings,
      async (newSettings) => {
        this.effectiveSettings = newSettings;
        await updateExplorerBlock(
          this.app,
          this.container,
          this.ctx,
          this.sourcePath,
          newSettings,
        );
        await this.render();
      },
    ).open();
  }

  private async promptNewFolder(basePath: string): Promise<void> {
    const name = await this.promptForName("New Folder", "Enter folder name");
    if (!name) return;

    await createFolderWithNote(this.app, basePath, name);
  }

  private async createNewNote(basePath: string): Promise<void> {
    const name = await this.promptForName("New Note", "Enter note name");
    if (!name) return;

    await createNewNote(this.app, basePath, name);
  }

  private promptForName(
    title: string,
    placeholder: string,
  ): Promise<string | null> {
    return new Promise((resolve) => {
      new PromptModal(this.app, title, placeholder, resolve).open();
    });
  }
}
