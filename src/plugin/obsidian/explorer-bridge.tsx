import React from "react";
import { createRoot, Root } from "react-dom/client";
import { App, MarkdownPostProcessorContext, TFolder } from "obsidian";
import { ExplorerSettings } from "../../types";
import { isRtl } from "../../utils/helpers";
import { ExplorerUI } from "../../ui/explorer-ui";
import { ExplorerSettingsModal } from "../../ui/modals/settings-modal";
import { promptForName } from "../../ui/modals/prompt-modal";
import { ExplorerAPI } from "../../backend/explorer-api";

export class ExplorerBridge {
  private app: App;
  private container: HTMLElement;
  private effectiveSettings: ExplorerSettings;
  private ctx: MarkdownPostProcessorContext;
  private sourcePath: string;
  private reactRoot: Root | null = null;
  private currentFolder: TFolder | null = null;
  private api: ExplorerAPI;

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
    this.api = new ExplorerAPI(app);
  }

  async render(): Promise<void> {
    this.container.addClass("explorer-container");
    this.container.classList.toggle("use-glass", this.effectiveSettings.useGlass);
    this.container.setAttribute("dir", isRtl() ? "rtl" : "ltr");

    const model = await this.api.buildRenderModel({
      sourcePath: this.sourcePath,
      settings: this.effectiveSettings,
    });

    if (!model) {
      this.renderReact(<p>No active file or folder</p>);
      return;
    }

    this.currentFolder = model.folder;
    this.renderReact(
      <ExplorerUI
        app={this.app}
        sourcePath={this.sourcePath}
        folder={model.folder}
        effectiveSettings={this.effectiveSettings}
        folderInfos={model.folderInfos}
        depthFiles={model.depthFiles}
        folderNotes={model.folderNotes}
        getAllFiles={model.getAllFiles}
        onOpenSettings={() => this.openSettings()}
        onOpenFolderNote={(folder, newLeaf) =>
          void this.api.openFolderNote(folder, this.sourcePath, newLeaf)
        }
        onNewFolder={() => void this.promptAndCreateFolder()}
        onNewNote={() => void this.promptAndCreateNote()}
      />,
    );
  }

  private renderReact(node: React.ReactElement): void {
    if (!this.reactRoot) {
      this.reactRoot = createRoot(this.container);
    }
    this.reactRoot.render(node);
  }

  private openSettings(): void {
    new ExplorerSettingsModal(this.app, this.effectiveSettings, (newSettings) => {
      this.effectiveSettings = newSettings;
      void this.api
        .updateBlockSettings({
          container: this.container,
          ctx: this.ctx,
          sourcePath: this.sourcePath,
          settings: newSettings,
        })
        .then(() => this.render());
    }).open();
  }

  private async promptAndCreateFolder(): Promise<void> {
    if (!this.currentFolder) return;
    const name = await promptForName(this.app, "New Folder", "Enter folder name");
    if (!name) return;
    await this.api.createFolder(this.currentFolder.path, name);
  }

  private async promptAndCreateNote(): Promise<void> {
    if (!this.currentFolder) return;
    const name = await promptForName(this.app, "New Note", "Enter note name");
    if (!name) return;
    await this.api.createNote(this.currentFolder.path, name);
  }
}

