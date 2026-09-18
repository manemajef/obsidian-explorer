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
import { resolveExplorerMountKey } from "./domain/explorer-mount-key";

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

export type ExplorerMountHandle = {
  host: HTMLElement;
  adoptContainer: (container: HTMLElement) => void;
  cleanup: () => void;
};

type LiveBlock = {
  handle: ExplorerMountHandle;
  target: {
    container: HTMLElement;
    context: MarkdownPostProcessorContext;
  };
  releaseTimer: number | null;
};

const BLOCK_REUSE_WINDOW_MS = 250;
const liveBlocks = new Map<string, LiveBlock>();

function resolveDirection(settings: BlockSettings): "rtl" | "ltr" {
  if (settings.textDirection && settings.textDirection !== "auto") {
    return settings.textDirection;
  }
  return isRtl() ? "rtl" : "ltr";
}

function getBlockKey(
  context: MarkdownPostProcessorContext,
  container: HTMLElement,
  initialOverrides: Partial<BlockSettings>,
): string | null {
  const section = context.getSectionInfo(container);
  return resolveExplorerMountKey({
    docId: context.docId,
    sourcePath: context.sourcePath,
    lineStart: section?.lineStart ?? null,
    lineEnd: section?.lineEnd ?? null,
    blockConfig: JSON.stringify(initialOverrides),
  });
}

function scheduleBlockRelease(key: string, container: HTMLElement): void {
  const live = liveBlocks.get(key);
  if (!live || live.target.container !== container) return;

  const ownerWindow = container.ownerDocument.defaultView;
  if (!ownerWindow) {
    disposeLiveBlock(key);
    return;
  }
  if (live.releaseTimer !== null) {
    ownerWindow.clearTimeout(live.releaseTimer);
  }
  live.releaseTimer = ownerWindow.setTimeout(() => {
    const current = liveBlocks.get(key);
    if (!current || current.target.container !== container) return;
    disposeLiveBlock(key);
  }, BLOCK_REUSE_WINDOW_MS);
}

function disposeLiveBlock(key: string): void {
  const live = liveBlocks.get(key);
  if (!live) return;
  liveBlocks.delete(key);
  live.handle.cleanup();
}

export function disposeAllExplorerBlocks(): void {
  for (const key of Array.from(liveBlocks.keys())) disposeLiveBlock(key);
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
  const key = getBlockKey(ctx, container, initialOverrides);
  const child = new MarkdownRenderChild(container);
  const existing = key === null ? undefined : liveBlocks.get(key);

  if (key !== null && existing) {
    const ownerWindow = container.ownerDocument.defaultView;
    if (existing.releaseTimer !== null && ownerWindow) {
      ownerWindow.clearTimeout(existing.releaseTimer);
      existing.releaseTimer = null;
    }
    existing.target.container = container;
    existing.target.context = ctx;
    existing.handle.adoptContainer(container);
    child.register(() => scheduleBlockRelease(key, container));
    ctx.addChild(child);
    return;
  }

  const target = { container, context: ctx };
  let cleanup: (() => void) | null = null;
  let unloaded = false;
  child.register(() => {
    unloaded = true;
    if (key === null) {
      cleanup?.();
      return;
    }
    scheduleBlockRelease(key, container);
  });
  ctx.addChild(child);

  const handle = await mountExplorerBlock({
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
        container: target.container,
        context: target.context,
        sourcePath,
        defaultSettings: getBlockDefaults(),
        settings: newSettings,
      });
    },
  });

  if (unloaded) {
    handle.cleanup();
    return;
  }
  if (key === null) {
    cleanup = handle.cleanup;
    return;
  }
  liveBlocks.set(key, { handle, target, releaseTimer: null });
}

export async function mountExplorer(input: ExplorerMount): Promise<() => void> {
  return (await mountExplorerBlock(input)).cleanup;
}

async function mountExplorerBlock(
  input: ExplorerMount,
): Promise<ExplorerMountHandle> {
  const {
    app,
    sourceFolder,
    getBlockDefaults,
    getPluginSettings,
    initialOverrides,
    registerRefresh,
    replaceExplorerBlock,
  } = input;
  let container = input.container;
  container.addClass("explorer-container");
  const host = container.createDiv({ cls: "explorer-mount-host" });
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

  const reactRoot = createRoot(host);
  let blockOverrides = { ...initialOverrides };
  const session = new ExplorerSession(app);
  const getBaseDefaults = (): BlockSettings => ({
    ...getBlockDefaults(),
    ...initialOverrides,
  });
  let effectiveSettings = resolveBlockSettings(
    getBaseDefaults(),
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
    blockOverrides = getBlockSettingsOverrides(newSettings, getBaseDefaults());
    void (replaceExplorerBlock?.(newSettings, sourcePath) ?? Promise.resolve())
      .then((saved) => {
        if (saved === false) {
          effectiveSettings = previousSettings;
          blockOverrides = previousOverrides;
        }
        return render();
      });
  };

  const applyContainerState = (): void => {
    const direction = resolveDirection(effectiveSettings);
    container.setAttribute("dir", direction);
    container.dataset.explorerTextDirection = effectiveSettings.textDirection;
    container.toggleClass(
      "explorer-disable-glass-toolbar",
      effectiveSettings.disableGlassToolbar,
    );
  };

  const render = async (): Promise<void> => {
    const pluginSettings = getPluginSettings();
    effectiveSettings = resolveBlockSettings(
      getBaseDefaults(),
      blockOverrides,
    );
    applyContainerState();

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
  return {
    host,
    adoptContainer: (nextContainer) => {
      if (nextContainer === container) return;
      container = nextContainer;
      container.addClass("explorer-container");
      container.appendChild(host);
      applyContainerState();
    },
    cleanup: () => {
      for (const cleanup of cleanupCallbacks.splice(0)) cleanup();
      host.remove();
    },
  };
}
