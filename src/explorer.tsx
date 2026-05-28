import React from "react";
import { createRoot } from "react-dom/client";
import {
  App,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
} from "obsidian";
import {
  BlockSettings,
  PluginSettings,
  getBlockSettingsOverrides,
  resolveBlockSettings,
} from "./explorer/settings";
import { isRtl } from "./utils";
import { ExplorerUI } from "./ui/explorer-ui";
import { ExplorerSettingsModal } from "./ui/modals/settings-modal";
import { buildExplorerModel } from "./explorer/model";
import { updateExplorerBlock } from "./explorer/vault/block-update";
import { ExplorerSession } from "./explorer/session";

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
): Promise<void> {
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

  const queueRefresh = (path?: string): void => {
    session.invalidate(path);
    if (refreshQueued || isUnmounted) return;
    refreshQueued = true;
    window.requestAnimationFrame(() => {
      if (isUnmounted) return;
      refreshQueued = false;
      void render();
    });
  };

  const child = new MarkdownRenderChild(container);
  child.registerEvent(
    app.vault.on("create", (file) => queueRefresh(file.path)),
  );
  child.registerEvent(
    app.vault.on("delete", (file) => queueRefresh(file.path)),
  );
  child.registerEvent(
    app.vault.on("rename", (file, oldPath) => {
      session.invalidate(oldPath);
      queueRefresh(file.path);
    }),
  );
  child.register(() => {
    isUnmounted = true;
    reactRoot.unmount();
  });
  if (registerRefresh) {
    child.register(registerRefresh(queueRefresh));
  }
  ctx.addChild(child);

  const openSettings = (): void => {
    new ExplorerSettingsModal(
      app,
      effectiveSettings,
      ctx.sourcePath,
      (newSettings) => {
        effectiveSettings = newSettings;
        const blockDefaults = getBlockDefaults();
        blockOverrides = getBlockSettingsOverrides(newSettings, blockDefaults);
        void updateExplorerBlock(
          app,
          container,
          ctx,
          ctx.sourcePath,
          blockDefaults,
          newSettings,
        ).then(render);
      },
    ).open();
  };

  const render = async (): Promise<void> => {
    const pluginSettings = getPluginSettings();
    effectiveSettings = resolveBlockSettings(
      getBlockDefaults(),
      blockOverrides,
    );
    container.setAttribute("dir", resolveDirection(effectiveSettings));
    container.toggleClass("use-glass", pluginSettings.useGlass);

    const model = await buildExplorerModel({
      app,
      session,
      sourcePath: ctx.sourcePath,
      settings: effectiveSettings,
      pluginSettings,
    });
    if (!model) {
      reactRoot.render(<p>No active file or folder</p>);
      return;
    }

    reactRoot.render(
      <ExplorerUI
        model={model}
        onOpenSettings={openSettings}
        onSavePluginSettings={savePluginSettings}
        onRefresh={queueRefresh}
      />,
    );
  };

  await render();
}
