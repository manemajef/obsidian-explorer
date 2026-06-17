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
import { registerActionBarSlot } from "./integration/action-bar-slot";

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
  actionBarContainer?: HTMLElement; // If provided, render action bar here instead of using slot system
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

async function waitForElement(
  container: HTMLElement,
  selector: string,
  maxAttempts: number,
  delayMs: number,
): Promise<void> {
  const findTarget = (): HTMLElement | null => {
    // Check in parent containers (cm-sizer, markdown-preview-sizer, etc.)
    const cmSizer = container.closest(".cm-sizer");
    if (cmSizer?.querySelector(selector)) return cmSizer as HTMLElement;

    const previewSizer = container.closest(".markdown-preview-sizer");
    if (previewSizer?.querySelector(selector)) return previewSizer as HTMLElement;

    return null;
  };

  for (let i = 0; i < maxAttempts; i++) {
    if (findTarget()) return;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
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
    actionBarContainer,
  } = input;
  container.addClass("explorer-container");

  const reactRoot = createRoot(container);
  // Only use slot system if no explicit action bar container is provided
  const actionBarSlot = actionBarContainer
    ? null
    : registerActionBarSlot(app, container);
  let blockOverrides = { ...initialOverrides };
  const session = new ExplorerSession(app);
  let effectiveSettings = resolveBlockSettings(
    getBlockDefaults(),
    blockOverrides,
  );
  let refreshTimer: number | null = null;
  let slotSyncTimer: number | null = null;
  let isUnmounted = false;
  let sourcePath = input.sourcePath;
  let hasRenderedOnce = false;

  const syncActionBarSlot = (): HTMLElement | null => {
    if (actionBarContainer) {
      return actionBarContainer;
    }
    return actionBarSlot?.sync() ?? null;
  };

  const queueSlotSync = (): void => {
    if (actionBarContainer) {
      // No need to sync if using explicit container
      return;
    }
    if (slotSyncTimer !== null) {
      window.clearTimeout(slotSyncTimer);
      slotSyncTimer = null;
    }
    if (isUnmounted) return;

    // Sync immediately to reduce flicker during mode changes
    void render();
  };

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
    if (refreshTimer !== null) {
      window.clearTimeout(refreshTimer);
    }
    if (isUnmounted) return;

    refreshTimer = window.setTimeout(() => {
      refreshTimer = null;
      if (isUnmounted) return;
      void render();
    }, 200);
  };

  const cleanupCallbacks: Array<() => void> = [];
  const registerCleanup = (cleanup: () => void): void => {
    cleanupCallbacks.push(cleanup);
  };
  const registerVaultEventRef = (ref: EventRef): void => {
    registerCleanup(() => app.vault.offref(ref));
  };
  const registerWorkspaceEventRef = (ref: EventRef): void => {
    registerCleanup(() => app.workspace.offref(ref));
  };
  registerVaultEventRef(app.vault.on("create", queueRefresh));
  registerVaultEventRef(app.vault.on("delete", queueRefresh));
  registerVaultEventRef(
    app.vault.on("rename", (file, oldPath) => {
      trackSourceRename(file, oldPath);
      queueRefresh();
    }),
  );
  registerWorkspaceEventRef(app.workspace.on("active-leaf-change", queueSlotSync));
  registerWorkspaceEventRef(app.workspace.on("file-open", queueSlotSync));
  registerWorkspaceEventRef(app.workspace.on("layout-change", queueSlotSync));
  registerWorkspaceEventRef(app.workspace.on("resize", queueSlotSync));
  registerCleanup(() => {
    isUnmounted = true;
    if (refreshTimer !== null) {
      window.clearTimeout(refreshTimer);
    }
    if (slotSyncTimer !== null) {
      window.clearTimeout(slotSyncTimer);
    }
    reactRoot.unmount();
    actionBarSlot?.dispose();
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
    // On first render with slot system, wait for inline-title to exist
    if (!hasRenderedOnce && !actionBarContainer && actionBarSlot) {
      hasRenderedOnce = true;
      await waitForElement(container, ".inline-title", 100, 10);
    }

    const pluginSettings = getPluginSettings();
    effectiveSettings = resolveBlockSettings(
      getBlockDefaults(),
      blockOverrides,
    );
    const direction = resolveDirection(effectiveSettings);
    const currentActionBarSlot = actionBarContainer || syncActionBarSlot();
    container.setAttribute("dir", direction);
    currentActionBarSlot?.setAttribute("dir", direction);
    container.toggleClass(
      "explorer-compact-action-bar",
      effectiveSettings.compactActionBar,
    );
    currentActionBarSlot?.toggleClass(
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
        key={model.sourcePath}
        model={model}
        onOpenSettings={openSettings}
        onSavePluginSettings={savePluginSettings}
        onRefresh={queueRefresh}
        onSaveFolderNote={input.onSaveFolderNote}
        onRemoveFolderNoteFile={input.removeFolderNoteFile}
        actionBarSlot={currentActionBarSlot}
      />,
    );
  };

  await render();
  return () => {
    for (const cleanup of cleanupCallbacks.splice(0)) cleanup();
  };
}
