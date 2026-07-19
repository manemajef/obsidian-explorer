import type { App } from "obsidian";
import {
  resolveParentDestination,
  resolveParentNewLeaf,
} from "../lib/parent-navigation";
import type { SavePluginSettings } from "../lib/folder-note";
import type { ExplorerLocation } from "./folder-notes";
import { openFolderNote } from "./folder-notes";
import { openHomePage, resolveHomePagePath } from "./homepage";
import type { PluginSettings } from "../settings";

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

  await openFolderNote(
    input.app,
    destination.folder,
    input.settings,
    input.location.path,
    newLeaf,
    "navigate",
    input.savePluginSettings,
  );
}
