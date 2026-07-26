import { App, Notice, TFile, type WorkspaceLeaf } from "obsidian";
import {
  HOME_PAGE_OVERRIDES,
  resolveHomePagePath,
} from "../domain/homepage";
import { markNavigationPending } from "../data/navigation-pending";
import type { PluginSettings } from "../settings";
import { openFileFreeFolderPageInLeaf } from "./open-file-free-folder-page";

export async function openHomePage(
  app: App,
  settings: PluginSettings,
  sourcePath = "",
  newLeaf = false,
): Promise<void> {
  await useHomePageFile(
    app,
    settings,
    async (file) => {
      markNavigationPending(file.path);
      await app.workspace.openLinkText(file.path, sourcePath, newLeaf);
    },
    async (homePath, homeTitle) => {
      await openFileFreeFolderPageInLeaf(
        app,
        app.workspace.getLeaf(newLeaf),
        {
          folderPath: app.vault.getRoot().path,
          sourcePath: homePath,
          title: homeTitle,
          initialOverrides: HOME_PAGE_OVERRIDES,
        },
        homePath,
      );
    },
  );
}

export async function openHomePageInLeaf(
  app: App,
  settings: PluginSettings,
  leaf: WorkspaceLeaf,
  canOpen: () => boolean,
): Promise<void> {
  if (!canOpen()) return;

  await useHomePageFile(
    app,
    settings,
    async (file) => {
      if (!canOpen()) return;
      markNavigationPending(file.path);
      await leaf.openFile(file);
    },
    async (homePath, homeTitle) => {
      if (!canOpen()) return;
      await openFileFreeFolderPageInLeaf(
        app,
        leaf,
        {
          folderPath: app.vault.getRoot().path,
          sourcePath: homePath,
          title: homeTitle,
          initialOverrides: HOME_PAGE_OVERRIDES,
        },
        homePath,
      );
    },
  );
}

async function useHomePageFile(
  app: App,
  settings: PluginSettings,
  openFile: (file: TFile) => Promise<void>,
  openFileFree: (homePath: string, homeTitle: string) => Promise<void>,
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

  await openFileFree(homePath, homePath.replace(/\.md$/i, ""));
}
