import { App, Notice, TFile, type WorkspaceLeaf } from "obsidian";
import { resolveHomePageTitle } from "../domain/homepage";
import type { PluginSettings } from "../settings";

type HomePageInlineTitleConfig = {
  value: string;
  onSave: (nextTitle: string) => Promise<boolean | void>;
};

type RenameHomePageInput = {
  app: App;
  leaf: WorkspaceLeaf;
  settings: PluginSettings;
  saveSettings: () => void | Promise<void>;
  updateVirtualState: (state: { sourcePath: string; title: string }) => void;
};

export function getHomePageInlineTitleConfig(
  input: RenameHomePageInput,
): HomePageInlineTitleConfig {
  return {
    value: resolveHomePageTitle(input.app, input.settings),
    onSave: async (nextTitle) => saveHomePageTitle(input, nextTitle),
  };
}

async function saveHomePageTitle(
  input: RenameHomePageInput,
  nextTitle: string,
): Promise<boolean> {
  const basename = nextTitle.replace(/\.md$/i, "").trim();
  if (!basename) {
    new Notice("Homepage name cannot be empty.");
    return false;
  }
  if (basename.includes("/") || basename.includes("\\")) {
    new Notice("Homepage name must be a root note name, not a path.");
    return false;
  }

  const sourcePath = `${basename}.md`;
  const existing = input.app.vault.getAbstractFileByPath(sourcePath);
  if (existing && !(existing instanceof TFile)) {
    new Notice(`Homepage path is not a note: ${sourcePath}`);
    return false;
  }

  input.settings.homePageName = basename;
  await input.saveSettings();

  if (existing instanceof TFile) {
    await input.leaf.openFile(existing);
    return true;
  }

  input.updateVirtualState({ sourcePath, title: basename });
  return true;
}
