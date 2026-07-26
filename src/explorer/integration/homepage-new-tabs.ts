import {
  App,
  MarkdownView,
  Plugin,
  type WorkspaceLeaf,
} from "obsidian";
import { resolveHomePagePath } from "../domain/homepage";
import { isHomePageNewTabManagedElsewhere } from "../domain/homepage-capability";
import {
  openHomePageInLeaf,
} from "../operations/open-homepage";
import { VIRTUAL_FOLDER_NOTE_VIEW_TYPE } from "../operations/open-file-free-folder-page";
import type { PluginSettings } from "../settings";

const SMART_NEWTAB = true;

export function registerHomePageNewTabs(
  plugin: Plugin,
  getSettings: () => PluginSettings,
): void {
  const { workspace } = plugin.app;

  workspace.onLayoutReady(() => {
    const knownLeaves = new WeakSet<WorkspaceLeaf>();
    let activeLeaf = workspace.getMostRecentLeaf();
    const openInEmptyLeaf = (
      leaf: WorkspaceLeaf,
      previousLeaf = activeLeaf,
    ): void => {
      const settings = getSettings();
      if (
        !settings.openHomePageInNewTabs ||
        isHomePageNewTabManagedElsewhere(plugin.app) ||
        (SMART_NEWTAB &&
          activeViewIsHomePage(plugin.app, settings, previousLeaf))
      ) {
        return;
      }

      void openHomePageInLeaf(
        plugin.app,
        settings,
        leaf,
        () => isEmptyLeaf(leaf),
      );
    };

    workspace.iterateAllLeaves((leaf) => {
      knownLeaves.add(leaf);
    });

    plugin.registerEvent(
      workspace.on("active-leaf-change", (leaf) => {
        const previousLeaf = activeLeaf;
        activeLeaf = leaf;
        if (!leaf || knownLeaves.has(leaf)) return;
        knownLeaves.add(leaf);
        void Promise.resolve().then(() => openInEmptyLeaf(leaf, previousLeaf));
      }),
    );

    const startupLeaf = workspace.getMostRecentLeaf();
    if (startupLeaf) openInEmptyLeaf(startupLeaf);
  });
}

function isEmptyLeaf(leaf: WorkspaceLeaf): boolean {
  return leaf.getViewState().type === "empty";
}

function activeViewIsHomePage(
  app: App,
  settings: PluginSettings,
  leaf: WorkspaceLeaf | null,
): boolean {
  const homePath = resolveHomePagePath(app, settings);
  if (!homePath || !leaf) return false;

  const view = leaf.view;
  if (view instanceof MarkdownView) {
    return view.file?.path === homePath;
  }

  const viewState = leaf.getViewState();
  return (
    viewState.type === VIRTUAL_FOLDER_NOTE_VIEW_TYPE &&
    isRecord(viewState.state) &&
    viewState.state.sourcePath === homePath
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
