import React from "react";
import { createRoot } from "react-dom/client";
import {
  App,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  TAbstractFile,
  TFile,
  TFolder,
} from "obsidian";
import type { EventRef } from "obsidian";
import {
  BlockSettings,
  PluginSettings,
  getBlockSettingsOverrides,
  resolveBlockSettings,
} from "./settings";
import { isRtl } from "../utils";
import { ExplorerUI } from "../ui/explorer-ui";
import { ExplorerSettingsModal } from "../ui/modals/settings-modal";
import { buildExplorerModel } from "./model";
import { updateExplorerBlock } from "./vault/block-update";
import { ExplorerSession } from "./data/session";

export type ExplorerMount = {
  app: App;
  container: HTMLElement;
  sourcePath: string;
  sourceFolder?: TFolder;
  getBlockDefaults: () => BlockSettings;
  getPluginSettings: () => PluginSettings;
  savePluginSettings: () => void | Promise<void>;
  initialOverrides: Partial<BlockSettings>;
  registerRefresh?: (refresh: () => void) => () => void;
  replaceExplorerBlock?: (
    settings: BlockSettings,
    sourcePath: string,
  ) => Promise<boolean | void>;
  onSaveFolderNote?: () => void | Promise<void>;
  folderNote?: FolderNoteConversion;
  removeFolderNoteFile?: (file: TFile) => void | Promise<void>;
};

export type FolderNoteConversion = {
  isFile: boolean;
  convert: (settings: BlockSettings) => void | Promise<void>;
};

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
  getBlockDefaults: () => BlockSettings,
  getPluginSettings: () => PluginSettings,
  savePluginSettings: () => void | Promise<void>,
  initialOverrides: Partial<BlockSettings>,
  registerRefresh?: (refresh: () => void) => () => void,
  folderNote?: FolderNoteConversion,
  removeFolderNoteFile?: (file: TFile) => void | Promise<void>,
): Promise<void> {
  const child = new MarkdownRenderChild(container);
  const cleanup = await mountExplorer({
    app,
    container,
    sourcePath: ctx.sourcePath,
    getBlockDefaults,
    getPluginSettings,
    savePluginSettings,
    initialOverrides,
    registerRefresh,
    folderNote,
    removeFolderNoteFile,
    replaceExplorerBlock: async (newSettings, sourcePath) => {
      await updateExplorerBlock(
        app,
        container,
        ctx,
        sourcePath,
        getBlockDefaults(),
        newSettings,
      );
    },
  });
  child.register(cleanup);
  ctx.addChild(child);
}

export async function mountExplorer(input: ExplorerMount): Promise<() => void> {
  const {
    app,
    container,
    sourceFolder,
    getBlockDefaults,
    getPluginSettings,
    savePluginSettings,
    initialOverrides,
    registerRefresh,
    replaceExplorerBlock,
  } = input;
  container.addClass("explorer-container");

  const reactRoot = createRoot(container);
  let blockOverrides = { ...initialOverrides };
  const session = new ExplorerSession(app);
  let effectiveSettings = resolveBlockSettings(
    getBlockDefaults(),
    blockOverrides,
  );
  let refreshQueued = false;
  let isUnmounted = false;
  let renderVersion = 0;
  let sourcePath = input.sourcePath;

  const trackSourceRename = (file: TAbstractFile, oldPath: string): void => {
    if (sourcePath === oldPath) {
      sourcePath = file.path;
      return;
    }

    if (file instanceof TFolder && sourcePath.startsWith(`${oldPath}/`)) {
      sourcePath = `${file.path}${sourcePath.slice(oldPath.length)}`;
    }
  };

  const queueRefresh = (): void => {
    session.invalidate();
    if (refreshQueued || isUnmounted) return;
    refreshQueued = true;
    window.requestAnimationFrame(() => {
      if (isUnmounted) return;
      refreshQueued = false;
      void render();
    });
  };

  const cleanupCallbacks: Array<() => void> = [];
  const registerCleanup = (cleanup: () => void): void => {
    cleanupCallbacks.push(cleanup);
  };
  const registerEventRef = (ref: EventRef): void => {
    registerCleanup(() => app.vault.offref(ref));
  };
  registerEventRef(app.vault.on("create", queueRefresh));
  registerEventRef(app.vault.on("delete", queueRefresh));
  registerEventRef(
    app.vault.on("rename", (file, oldPath) => {
      trackSourceRename(file, oldPath);
      queueRefresh();
    }),
  );
  registerCleanup(() => {
    isUnmounted = true;
    reactRoot.unmount();
  });
  if (registerRefresh) {
    registerCleanup(registerRefresh(queueRefresh));
  }

  const openSettings = (): void => {
    const conversion = input.folderNote
      ? {
          isFile: input.folderNote.isFile,
          run: () => input.folderNote?.convert(effectiveSettings),
        }
      : undefined;
    new ExplorerSettingsModal(
      app,
      effectiveSettings,
      sourcePath,
      (newSettings) => {
        const previousSettings = effectiveSettings;
        const previousOverrides = blockOverrides;
        effectiveSettings = newSettings;
        const blockDefaults = getBlockDefaults();
        blockOverrides = getBlockSettingsOverrides(newSettings, blockDefaults);
        void (
          replaceExplorerBlock?.(newSettings, sourcePath) ?? Promise.resolve()
        ).then((saved) => {
          if (saved === false) {
            effectiveSettings = previousSettings;
            blockOverrides = previousOverrides;
          }
          return render();
        });
      },
      conversion,
    ).open();
  };

  const render = async (): Promise<void> => {
    renderVersion += 1;
    const pluginSettings = getPluginSettings();
    effectiveSettings = resolveBlockSettings(
      getBlockDefaults(),
      blockOverrides,
    );
    container.setAttribute("dir", resolveDirection(effectiveSettings));
    container.toggleClass(
      "explorer-compact-action-bar",
      effectiveSettings.compactActionBar,
    );

    const model = await buildExplorerModel({
      app,
      session,
      sourcePath,
      sourceFolder,
      settings: effectiveSettings,
      pluginSettings,
    });
    if (!model) {
      reactRoot.render(<p>No active file or folder</p>);
      return;
    }

    reactRoot.render(
      <ExplorerUI
        key={renderVersion}
        model={model}
        onOpenSettings={openSettings}
        onSavePluginSettings={savePluginSettings}
        onRefresh={queueRefresh}
        onSaveFolderNote={input.onSaveFolderNote}
        onRemoveFolderNoteFile={input.removeFolderNoteFile}
      />,
    );
  };

  await render();
  return () => {
    for (const cleanup of cleanupCallbacks.splice(0)) cleanup();
  };
}
