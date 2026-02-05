import React from "react";
import { createRoot, Root } from "react-dom/client";
import {
  App,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
} from "obsidian";
import { BlockSettings } from "../settings/schema";
import { isRtl } from "../utils/helpers";
import { ExplorerUI } from "../ui/explorer-ui";
import { ExplorerSettingsModal } from "../ui/modals/settings-modal";
import { ExplorerAPI } from "../backend/explorer-api";

export class ExplorerBridge {
  private app: App;
  private container: HTMLElement;
  private blockDefaults: BlockSettings;
  private effectiveSettings: BlockSettings;
  private ctx: MarkdownPostProcessorContext;
  private sourcePath: string;
  private reactRoot: Root | null = null;
  private api: ExplorerAPI;
  private refreshQueued = false;

  constructor(
    app: App,
    container: HTMLElement,
    blockDefaults: BlockSettings,
    effectiveSettings: BlockSettings,
    ctx: MarkdownPostProcessorContext,
  ) {
    this.app = app;
    this.container = container;
    this.blockDefaults = blockDefaults;
    this.effectiveSettings = effectiveSettings;
    this.ctx = ctx;
    this.sourcePath = ctx.sourcePath;
    this.api = new ExplorerAPI(app);
    this.bindVaultRefresh();
  }

  async render(): Promise<void> {
    this.container.addClass("explorer-container");
    this.container.classList.toggle(
      "use-glass",
      this.effectiveSettings.useGlass,
    );
    this.container.setAttribute("dir", isRtl() ? "rtl" : "ltr");

    const model = await this.api.buildRenderModel({
      sourcePath: this.sourcePath,
      settings: this.effectiveSettings,
    });

    if (!model) {
      this.renderReact(<p>No active file or folder</p>);
      return;
    }

    const folderPath = model.folder.path;
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
        onNewFolder={() => void this.api.promptAndCreateFolder(folderPath)}
        onNewNote={() => void this.api.promptAndCreateNote(folderPath)}
      />,
    );
  }

  private renderReact(node: React.ReactElement): void {
    if (!this.reactRoot) {
      this.reactRoot = createRoot(this.container);
    }
    this.reactRoot.render(node);
  }

  private queueRefresh = (): void => {
    if (this.refreshQueued) {
      return;
    }
    this.refreshQueued = true;
    window.requestAnimationFrame(() => {
      this.refreshQueued = false;
      void this.render();
    });
  };

  private bindVaultRefresh(): void {
    const child = new MarkdownRenderChild(this.container);
    child.registerEvent(this.app.vault.on("create", () => this.queueRefresh()));
    child.registerEvent(this.app.vault.on("delete", () => this.queueRefresh()));
    child.registerEvent(this.app.vault.on("rename", () => this.queueRefresh()));
    this.ctx.addChild(child);
  }

  private openSettings(): void {
    new ExplorerSettingsModal(
      this.app,
      this.effectiveSettings,
      (newSettings) => {
        this.effectiveSettings = newSettings;
        void this.api
          .updateBlockSettings({
            container: this.container,
            ctx: this.ctx,
            sourcePath: this.sourcePath,
            defaultSettings: this.blockDefaults,
            settings: newSettings,
          })
          .then(() => this.render());
      },
    ).open();
  }
}
