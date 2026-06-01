import { App, Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import { PluginSettings } from "../settings";

const HOME_PAGE_TEMPLATE =
  '```explorer\nview: "cards"\nsortBy: "edited"\ndepth: 10\npageSize: 21\n```\n';
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
        void Promise.resolve().then(() => openInEmptyLeaf(leaf));
      }),
    );

    const startupLeaf = workspace.getMostRecentLeaf();
    if (startupLeaf) openInEmptyLeaf(startupLeaf);
  });
}

export async function openHomePage(
  app: App,
  settings: PluginSettings,
  sourcePath = "",
  newLeaf = false,
): Promise<void> {
  await useHomePageFile(app, settings, async (file) => {
    await app.workspace.openLinkText(file.path, sourcePath, newLeaf);
  });
}

async function openHomePageInEmptyLeaf(
  app: App,
  settings: PluginSettings,
  leaf: WorkspaceLeaf,
): Promise<void> {
  if (!isEmptyLeaf(leaf)) return;

  await useHomePageFile(app, settings, async (file) => {
    if (!isEmptyLeaf(leaf)) return;
    await leaf.openFile(file);
  });
}

async function useHomePageFile(
  app: App,
  settings: PluginSettings,
  openFile: (file: TFile) => Promise<void>,
): Promise<void> {
  const configuredName = settings.homePageName.trim();
  if (
    settings.useHomePage &&
    (configuredName.includes("/") || configuredName.includes("\\"))
  ) {
    new Notice("Homepage name must be a root note name, not a path.");
    return;
  }

  const homePath = resolveHomePagePath(app, settings);
  if (!homePath) return;

  const existing = app.vault.getAbstractFileByPath(homePath);
  if (existing instanceof TFile) {
    await openFile(existing);
    return;
  }
  if (existing) {
    new Notice(`Homepage path is not a note: ${homePath}`);
    return;
  }

  try {
    const created = await app.vault.create(homePath, HOME_PAGE_TEMPLATE);
    await openFile(created);
  } catch (err) {
    new Notice(`Failed to create homepage: ${err}`);
  }
}

function isEmptyLeaf(leaf: WorkspaceLeaf): boolean {
  return leaf.getViewState().type === "empty";
}

export function resolveHomePagePath(
  app: App,
  settings: PluginSettings,
): string | null {
  if (!settings.useHomePage) return null;

  const configuredName = settings.homePageName.trim();
  const basename = (configuredName || app.vault.getName()).replace(
    /\.md$/i,
    "",
  );
  return basename && !basename.includes("/") && !basename.includes("\\")
    ? `${basename}.md`
    : null;
}
