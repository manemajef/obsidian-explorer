import { MarkdownView, Plugin, Vault } from "obsidian";
import type { PluginSettings } from "../settings";

type ForcedPreviewLeaf = MarkdownView["leaf"] & {
  _explorerViewForcedPreview?: boolean;
};

type VaultWithViewModeConfig = Vault & {
  config?: {
    defaultViewMode?: unknown;
  };
};

function getDefaultViewMode(vault: Vault): string {
  const mode = (vault as VaultWithViewModeConfig).config?.defaultViewMode;
  return typeof mode === "string" ? mode : "source";
}

/**
 * Opens notes that contain an explorer block in reading mode (and restores the
 * default mode when navigating away), so the embedded explorer renders.
 */
export function registerExplorerReadingMode(
  plugin: Plugin,
  getSettings: () => PluginSettings,
): void {
  const { app } = plugin;

  plugin.registerEvent(
    app.workspace.on("file-open", async (file) => {
      if (!file) return;
      const view = app.workspace.getActiveViewOfType(MarkdownView);
      if (!view) return;
      if (getDefaultViewMode(app.vault) === "preview") return;
      const leaf = view.leaf as ForcedPreviewLeaf;
      const content = await app.vault.cachedRead(file);
      const hasExplorerBlock = content.includes("```explorer");

      if (!getSettings().forceReadingMode && hasExplorerBlock) {
        delete leaf._explorerViewForcedPreview;
        window.setTimeout(() => {
          if (view.editor) {
            view.editor.blur();
          }
        }, 10);
        return;
      }
      if (hasExplorerBlock) {
        const state = leaf.getViewState();
        if (state.state && state.state.mode !== "preview")
          state.state.mode = "preview";
        await leaf.setViewState(state);
        leaf._explorerViewForcedPreview = true;
      } else if (leaf._explorerViewForcedPreview) {
        const state = leaf.getViewState();
        const defaultMode = getDefaultViewMode(app.vault);
        if (state.state) state.state.mode = defaultMode;
        await leaf.setViewState(state);
        delete leaf._explorerViewForcedPreview;
      }
    }),
  );
}
