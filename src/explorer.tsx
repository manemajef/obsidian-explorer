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
import { isRtl } from "./explorer/file-utils";
import { ExplorerUI } from "./ui/explorer-ui";
import { ExplorerSettingsModal } from "./ui/modals/settings-modal";
import { buildExplorerModel } from "./explorer/model";
import { updateExplorerBlock } from "./explorer/block-update";

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
  let effectiveSettings = resolveBlockSettings(
    getBlockDefaults(),
    blockOverrides,
  );
  let refreshQueued = false;
  let isUnmounted = false;

  const queueRefresh = (): void => {
    if (refreshQueued || isUnmounted) return;
    refreshQueued = true;
    window.requestAnimationFrame(() => {
      if (isUnmounted) return;
      refreshQueued = false;
      void render();
    });
  };

  const child = new MarkdownRenderChild(container);
  child.registerEvent(app.vault.on("create", queueRefresh));
  child.registerEvent(app.vault.on("delete", queueRefresh));
  child.registerEvent(app.vault.on("rename", queueRefresh));
  child.register(() => {
    isUnmounted = true;
    reactRoot.unmount();
  });
  if (registerRefresh) {
    child.register(registerRefresh(queueRefresh));
  }
  ctx.addChild(child);

  const openSettings = (): void => {
    new ExplorerSettingsModal(app, effectiveSettings, (newSettings) => {
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
    }).open();
  };

  const render = async (): Promise<void> => {
    effectiveSettings = resolveBlockSettings(
      getBlockDefaults(),
      blockOverrides,
    );
    container.setAttribute("dir", resolveDirection(effectiveSettings));
    container.toggleClass("use-glass", effectiveSettings.useGlass);

    const model = await buildExplorerModel({
      app,
      sourcePath: ctx.sourcePath,
      settings: effectiveSettings,
      pluginSettings: getPluginSettings(),
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
      />,
    );
  };

  await render();
}
