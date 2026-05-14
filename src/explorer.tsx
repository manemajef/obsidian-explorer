import React from "react";
import { createRoot } from "react-dom/client";
import {
  App,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  TFile,
} from "obsidian";
import { BlockSettings } from "./settings/schema";
import { isRtl } from "./vault/file-utils";
import { ExplorerUI } from "./ui/explorer-ui";
import { ExplorerSettingsModal } from "./ui/modals/settings-modal";
import { FolderIndex } from "./vault/folder-index";
import {
  openOrCreateFolderNote,
  promptAndCreateFolder,
  promptAndCreateNote,
  updateExplorerBlock,
} from "./vault/actions";

function resolveDirection(settings: BlockSettings): "rtl" | "ltr" {
  if (settings.textDirection && settings.textDirection !== "auto") {
    return settings.textDirection;
  }
  return isRtl() ? "rtl" : "ltr";
}

export async function renderExplorerBlock(
  app: App,
  container: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  blockDefaults: BlockSettings,
  initialSettings: BlockSettings,
): Promise<void> {
  container.addClass("explorer-container");

  const reactRoot = createRoot(container);
  let effectiveSettings = initialSettings;
  let refreshQueued = false;

  const queueRefresh = (): void => {
    if (refreshQueued) return;
    refreshQueued = true;
    window.requestAnimationFrame(() => {
      refreshQueued = false;
      void render();
    });
  };

  const child = new MarkdownRenderChild(container);
  child.registerEvent(app.vault.on("create", queueRefresh));
  child.registerEvent(app.vault.on("delete", queueRefresh));
  child.registerEvent(app.vault.on("rename", queueRefresh));
  ctx.addChild(child);

  const openSettings = (): void => {
    new ExplorerSettingsModal(app, effectiveSettings, (newSettings) => {
      effectiveSettings = newSettings;
      void updateExplorerBlock(
        app,
        container,
        ctx,
        ctx.sourcePath,
        blockDefaults,
        newSettings,
      ).then(render);
    }).open();
  };

  const render = async (): Promise<void> => {
    container.setAttribute("dir", resolveDirection(effectiveSettings));
    container.toggleClass("use-glass", effectiveSettings.useGlass);

    const blockFile = app.vault.getAbstractFileByPath(ctx.sourcePath);
    if (!(blockFile instanceof TFile) || !blockFile.parent) {
      reactRoot.render(<p>No active file or folder</p>);
      return;
    }

    const folder = blockFile.parent;
    const folderIndex = new FolderIndex(app, folder);
    await folderIndex.loadToDepth(effectiveSettings.depth);

    const depthFiles = folderIndex.getFilesToDisplay(effectiveSettings);
    let cachedAllFiles: TFile[] | null = null;
    const getAllFiles = async (): Promise<TFile[]> => {
      if (cachedAllFiles) return cachedAllFiles;
      cachedAllFiles = await folderIndex.getAllContent();
      return cachedAllFiles;
    };

    reactRoot.render(
      <ExplorerUI
        app={app}
        sourcePath={ctx.sourcePath}
        folder={folder}
        effectiveSettings={effectiveSettings}
        folderInfos={folderIndex.folders}
        depthFiles={depthFiles}
        folderNotes={folderIndex.folderNotes}
        getAllFiles={getAllFiles}
        onOpenSettings={openSettings}
        onOpenFolderNote={(f, newLeaf) =>
          void openOrCreateFolderNote(app, f, ctx.sourcePath, newLeaf)
        }
        onNewFolder={() => void promptAndCreateFolder(app, folder.path)}
        onNewNote={() => void promptAndCreateNote(app, folder.path)}
      />,
    );
  };

  await render();
}
