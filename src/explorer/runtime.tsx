import React from "react";
import { createRoot } from "react-dom/client";
import {
  App,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  TAbstractFile,
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
import { updateExplorerBlock } from "./operations/update-explorer-block";
import { ExplorerSession } from "./data/session";
import { consumeNavigationPending } from "./data/navigation-pending";
import type { ExplorerApi } from "./api";
import { isFolderNote } from "./domain/folder-note";
import { resolveHomePagePath } from "./domain/homepage";

export type ExplorerMount = {
  explorerApi: ExplorerApi;
  app: App;
  container: HTMLElement;
  sourcePath: string;
  sourceFolder?: TFolder;
  getBlockDefaults: () => BlockSettings;
  getPluginSettings: () => PluginSettings;
  initialOverrides: Partial<BlockSettings>;
  registerRefresh?: (refresh: () => void) => () => void;
  replaceExplorerBlock?: (
    settings: BlockSettings,
    sourcePath: string,
  ) => Promise<boolean | void>;
};

function resolveDirection(settings: BlockSettings): "rtl" | "ltr" {
  if (settings.textDirection && settings.textDirection !== "auto") {
    return settings.textDirection;
  }
  return isRtl() ? "rtl" : "ltr";
}

export async function renderExplorerBlock(
  explorerApi: ExplorerApi,
  app: App,
  container: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  getBlockDefaults: () => BlockSettings,
  getPluginSettings: () => PluginSettings,
  initialOverrides: Partial<BlockSettings>,
  registerRefresh?: (refresh: () => void) => () => void,
): Promise<void> {
  const child = new MarkdownRenderChild(container);
  const cleanup = await mountExplorer({
    explorerApi,
    app,
    container,
    sourcePath: ctx.sourcePath,
    getBlockDefaults,
    getPluginSettings,
    initialOverrides,
    registerRefresh,
    replaceExplorerBlock: async (newSettings, sourcePath) => {
      await updateExplorerBlock({
        app,
        container,
        context: ctx,
        sourcePath,
        defaultSettings: getBlockDefaults(),
        settings: newSettings,
      });
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
    initialOverrides,
    registerRefresh,
    replaceExplorerBlock,
  } = input;
  container.addClass("explorer-container");
  let clearNavigationPlaceholder: (() => void) | null = null;
  if (consumeNavigationPending(input.sourcePath)) {
    // Added before render() so the placeholder height is in the DOM before
    // content below the block has a chance to render.
    container.addClass("explorer-navigating");
    clearNavigationPlaceholder = () => {
      const win = container.ownerDocument.defaultView ?? window;
      win.requestAnimationFrame(() =>
        container.removeClass("explorer-navigating"),
      );
      clearNavigationPlaceholder = null;
    };
  }

  const reactRoot = createRoot(container);
  let blockOverrides = { ...initialOverrides };
  const session = new ExplorerSession(app);
  let effectiveSettings = resolveBlockSettings(
    getBlockDefaults(),
    blockOverrides,
  );
  let refreshTimer: number | null = null;
  let isUnmounted = false;
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
  registerVaultEventRef(app.vault.on("create", queueRefresh));
  registerVaultEventRef(app.vault.on("delete", queueRefresh));
  registerVaultEventRef(
    app.vault.on("rename", (file, oldPath) => {
      trackSourceRename(file, oldPath);
      queueRefresh();
    }),
  );
  registerCleanup(() => {
    isUnmounted = true;
    if (refreshTimer !== null) {
      window.clearTimeout(refreshTimer);
    }
    reactRoot.unmount();
  });
  if (registerRefresh) {
    registerCleanup(registerRefresh(queueRefresh));
  }

  const updateSettings = (newSettings: BlockSettings): void => {
    const previousSettings = effectiveSettings;
    const previousOverrides = blockOverrides;
    effectiveSettings = newSettings;
    const blockDefaults = getBlockDefaults();
    blockOverrides = getBlockSettingsOverrides(newSettings, blockDefaults);
    void (replaceExplorerBlock?.(newSettings, sourcePath) ?? Promise.resolve())
      .then((saved) => {
        if (saved === false) {
          effectiveSettings = previousSettings;
          blockOverrides = previousOverrides;
        }
        return render();
      });
  };

  const render = async (): Promise<void> => {
    const pluginSettings = getPluginSettings();
    effectiveSettings = resolveBlockSettings(
      getBlockDefaults(),
      blockOverrides,
    );
    const direction = resolveDirection(effectiveSettings);
    container.setAttribute("dir", direction);
    container.dataset.explorerTextDirection = effectiveSettings.textDirection;
    container.toggleClass(
      "explorer-disable-glass-toolbar",
      effectiveSettings.disableGlassToolbar,
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
      clearNavigationPlaceholder?.();
      return;
    }

    const explorer = input.explorerApi.at(model.location);
    const sourceFile = model.location.file;
    const isMarkdownBacking =
      sourceFile !== null &&
      (isFolderNote(sourceFile) ||
        (model.folder.isRoot() &&
          sourceFile.path === resolveHomePagePath(app, pluginSettings)));
    const backingAction = isMarkdownBacking
      ? {
          isFile: true,
          run: () =>
            explorer.removeMarkdownBacking(
              model.folder,
              effectiveSettings,
            ),
        }
      : sourceFolder && sourceFile === null
        ? {
            isFile: false,
            run: () => explorer.addMarkdownBacking(effectiveSettings),
          }
        : undefined;
    const openSettings = (): void => {
      new ExplorerSettingsModal(
        app,
        effectiveSettings,
        sourcePath,
        updateSettings,
        backingAction,
        sourceFolder,
      ).open();
    };

    reactRoot.render(
      <ExplorerUI
        key={model.sourcePath}
        model={model}
        explorer={explorer}
        onOpenSettings={openSettings}
        onSettingsChange={updateSettings}
        onRefresh={queueRefresh}
      />,
    );
    clearNavigationPlaceholder?.();
  };

  await render();
  return () => {
    for (const cleanup of cleanupCallbacks.splice(0)) cleanup();
  };
}
