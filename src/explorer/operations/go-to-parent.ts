import type { App } from "obsidian";
import {
  resolveParentDestination,
  resolveParentNewLeaf,
} from "../domain/parent-navigation";
import type { ExplorerLocation } from "../domain/explorer-location";
import { resolveHomePagePath } from "../domain/homepage";
import { openFolderPage } from "./open-folder-page";
import { openHomePage } from "./open-homepage";
import type { PluginSettings } from "../settings";

type SavePluginSettings = () => void | Promise<void>;

export function canNavigateToParent(
  app: App,
  settings: PluginSettings,
  location: ExplorerLocation | null,
): boolean {
  return resolveParentDestination(
    location,
    resolveHomePagePath(app, settings),
  ) !== null;
}

export async function navigateToParent(input: {
  app: App;
  settings: PluginSettings;
  location: ExplorerLocation | null;
  newLeaf?: boolean;
  savePluginSettings?: SavePluginSettings;
}): Promise<void> {
  const destination = resolveParentDestination(
    input.location,
    resolveHomePagePath(input.app, input.settings),
  );
  if (!destination || !input.location) return;

  const newLeaf = resolveParentNewLeaf(
    input.newLeaf,
    input.settings.goToParentInNewTab,
  );
  if (destination.kind === "homepage") {
    await openHomePage(
      input.app,
      input.settings,
      input.location.path,
      newLeaf,
    );
    return;
  }

  await openFolderPage(
    input.app,
    destination.folder,
    input.settings,
    input.location.path,
    { newLeaf, intent: "navigate" },
    input.savePluginSettings,
  );
}
