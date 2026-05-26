import { App, Plugin, WorkspaceLeaf } from "obsidian";
import { openHomePageInEmptyLeaf } from "./navigation";
import { PluginSettings } from "./settings";

const NEW_TAB_DEFAULT_PAGE_PLUGIN_ID = "new-tab-default-page";

type AppWithCommunityPlugins = App & {
  plugins?: {
    enabledPlugins?: Set<string>;
  };
};

/**
 * Obsidian does not expose enabled community plugins in its public API.
 * Keep this unsupported lookup scoped to this feature's conflict handling.
 */
export function isHomePageNewTabManagedElsewhere(app: App): boolean {
  const pluginManager = (app as AppWithCommunityPlugins).plugins;
  return (
    pluginManager?.enabledPlugins?.has(NEW_TAB_DEFAULT_PAGE_PLUGIN_ID) ?? false
  );
}

export function registerHomePageNewTabs(
  plugin: Plugin,
  getSettings: () => PluginSettings,
): void {
  const { workspace } = plugin.app;

  workspace.onLayoutReady(() => {
    const knownLeaves = new WeakSet<WorkspaceLeaf>();
    const openInEmptyLeaf = (leaf: WorkspaceLeaf): void => {
      const settings = getSettings();
      if (
        !settings.openHomePageInNewTabs ||
        isHomePageNewTabManagedElsewhere(plugin.app)
      ) {
        return;
      }

      void openHomePageInEmptyLeaf(plugin.app, settings, leaf);
    };

    workspace.iterateAllLeaves((leaf) => {
      knownLeaves.add(leaf);
    });

    plugin.registerEvent(
      workspace.on("active-leaf-change", (leaf) => {
        if (!leaf || knownLeaves.has(leaf)) return;
        knownLeaves.add(leaf);

        // A file opened in a new tab starts as an empty leaf in the same action.
        // Let Obsidian assign that view before treating the leaf as a blank tab.
        void Promise.resolve().then(() => {
          openInEmptyLeaf(leaf);
        });
      }),
    );

    // On a fresh launch Obsidian may create the initial empty tab before this
    // plugin can listen for new leaves. Only consider the current startup leaf:
    // restored notes and non-empty views are left untouched.
    const startupLeaf = workspace.getMostRecentLeaf();
    if (startupLeaf) openInEmptyLeaf(startupLeaf);
  });
}
