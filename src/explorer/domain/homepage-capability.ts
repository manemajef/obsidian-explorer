import type { App } from "obsidian";

const NEW_TAB_DEFAULT_PAGE_PLUGIN_ID = "new-tab-default-page";

type AppWithCommunityPlugins = {
  plugins?: {
    enabledPlugins?: Set<string>;
  };
};

export function isHomePageNewTabManagedElsewhere(app: App): boolean {
  const pluginManager = (app as unknown as AppWithCommunityPlugins).plugins;
  return Boolean(
    pluginManager?.enabledPlugins?.has(NEW_TAB_DEFAULT_PAGE_PLUGIN_ID),
  );
}
