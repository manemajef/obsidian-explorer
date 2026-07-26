import type { App } from "obsidian";

const NEW_TAB_DEFAULT_PAGE_PLUGIN_ID = "new-tab-default-page";

type AppWithCommunityPlugins = App & {
  plugins?: {
    enabledPlugins?: Set<string>;
  };
};

export function isHomePageNewTabManagedElsewhere(app: App): boolean {
  const pluginManager = (app as AppWithCommunityPlugins).plugins;
  return (
    pluginManager?.enabledPlugins?.has(NEW_TAB_DEFAULT_PAGE_PLUGIN_ID) ?? false
  );
}
