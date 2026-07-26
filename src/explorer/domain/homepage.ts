import { App, TFolder } from "obsidian";
import type { BlockSettings, PluginSettings } from "../settings";

export const HOME_PAGE_OVERRIDES: Partial<BlockSettings> = {
  view: "cards",
  sortBy: "edited",
  includeSubfolders: true,
  pageSize: 21,
};

export function getHomePageInitialOverrides(
  app: App,
  settings: PluginSettings,
  sourcePath: string,
): Partial<BlockSettings> {
  return resolveHomePagePath(app, settings) === sourcePath
    ? HOME_PAGE_OVERRIDES
    : {};
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

export function resolveHomePageTitle(
  app: App,
  settings: PluginSettings,
): string {
  return resolveHomePagePath(app, settings)?.replace(/\.md$/i, "") ?? "";
}

export function resolveHomePageNoteInboxPath(
  app: App,
  settings: PluginSettings,
  sourcePath: string,
  fallbackFolderPath: string,
): string {
  const homePath = resolveHomePagePath(app, settings);
  if (!homePath || sourcePath !== homePath) return fallbackFolderPath;

  const inboxPath = settings.homePageNoteInbox[0] ?? "";
  const inbox = app.vault.getAbstractFileByPath(inboxPath);
  return inbox instanceof TFolder ? inbox.path : "";
}
