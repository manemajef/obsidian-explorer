import {
  App,
  MarkdownPostProcessorContext,
  Notice,
  TFile,
  TFolder,
} from "obsidian";
import { BlockSettings, PluginSettings } from "../settings/schema";
import { serializeSettings } from "../settings/block-parser";
import { promptForName } from "../ui/modals/prompt-modal";

const FOLDERNOTE_TEMPLATE = "\n```explorer\n```\n";
const HOME_PAGE_TEMPLATE =
  '```explorer\nview: "cards"\nsortBy: "edited"\ndepth: 10\npageSize: 21\n```\n';
export type HomePageSettings = Pick<
  PluginSettings,
  "useHomePage" | "homePageName"
>;
type ParentNavigationTarget = TFolder | "home" | null;

// ===== HELPERS =====

function formatExplorerBlock(
  settings: BlockSettings,
  defaultSettings: BlockSettings,
): string {
  const yaml = serializeSettings(settings, defaultSettings);
  return yaml ? `\`\`\`explorer\n${yaml}\n\`\`\`` : "```explorer\n```";
}

function resolveHomePagePath(
  app: App,
  settings: HomePageSettings,
): string | null {
  if (!settings.useHomePage) return null;

  const configuredName = settings.homePageName.trim();
  const noteName = configuredName || app.vault.getName();
  const basename = noteName.replace(/\.md$/i, "");

  if (!basename || basename.includes("/") || basename.includes("\\")) {
    return null;
  }

  return `${basename}.md`;
}

function getCurrentFolder(app: App, sourcePath = ""): TFolder | null {
  const sourceFile = sourcePath
    ? app.vault.getAbstractFileByPath(sourcePath)
    : app.workspace.getActiveFile();
  const currentFile =
    sourceFile instanceof TFile ? sourceFile : app.workspace.getActiveFile();

  return currentFile?.parent ?? null;
}

function resolveParentNavigationTarget(
  app: App,
  homePageSettings: HomePageSettings,
  sourcePath = "",
): ParentNavigationTarget {
  const homePagePath = resolveHomePagePath(app, homePageSettings);
  const currentPath = sourcePath || app.workspace.getActiveFile()?.path;
  if (homePagePath && currentPath === homePagePath) {
    return null;
  }

  const currentFolder = getCurrentFolder(app, sourcePath);
  const parent = currentFolder?.parent;
  if (!parent || parent.isRoot()) {
    return homePageSettings.useHomePage ? "home" : null;
  }

  return parent;
}

export function canGoToParentFolderNote(
  app: App,
  homePageSettings: HomePageSettings,
  sourcePath = "",
): boolean {
  return (
    resolveParentNavigationTarget(app, homePageSettings, sourcePath) !== null
  );
}

// ===== BLOCK OPERATIONS =====

export async function updateExplorerBlock(
  app: App,
  container: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  sourcePath: string,
  defaultSettings: BlockSettings,
  settings: BlockSettings,
): Promise<void> {
  const file = app.vault.getAbstractFileByPath(sourcePath);
  if (!(file instanceof TFile)) return;

  const newBlock = formatExplorerBlock(settings, defaultSettings);
  const content = await app.vault.read(file);
  const sectionInfo = ctx.getSectionInfo(container);

  let newContent: string;

  if (!sectionInfo) {
    const regex = /```explorer\n[\s\S]*?```/;
    newContent = content.replace(regex, newBlock);
  } else {
    const lines = content.split("\n");
    const { lineStart, lineEnd } = sectionInfo;
    newContent = [
      ...lines.slice(0, lineStart),
      newBlock,
      ...lines.slice(lineEnd + 1),
    ].join("\n");
  }

  if (newContent !== content) {
    await app.vault.modify(file, newContent);
  }
}

// ===== FILE/FOLDER CREATION =====

export async function createFolderWithNote(
  app: App,
  basePath: string,
  name: string,
  template: string = FOLDERNOTE_TEMPLATE,
): Promise<void> {
  const folderPath = `${basePath}/${name}`;
  const folderNotePath = `${folderPath}/${name}.md`;

  try {
    const existingFolder = app.vault.getAbstractFileByPath(folderPath);
    if (!existingFolder) {
      await app.vault.createFolder(folderPath);
    }

    let file = app.vault.getAbstractFileByPath(folderNotePath);
    if (!file) {
      file = await app.vault.create(folderNotePath, template);
    }

    if (file instanceof TFile) {
      await app.workspace.getLeaf(false).openFile(file);
    }
  } catch (e) {
    new Notice(`Failed to create folder: ${e}`);
  }
}

export async function createNewNote(
  app: App,
  basePath: string,
  name: string,
): Promise<void> {
  const notePath = `${basePath}/${name}.md`;

  try {
    const existing = app.vault.getAbstractFileByPath(notePath);
    if (existing instanceof TFile) {
      await app.workspace.getLeaf(false).openFile(existing);
      return;
    }

    const file = await app.vault.create(notePath, "");
    await app.workspace.getLeaf(false).openFile(file);
  } catch (e) {
    new Notice(`Failed to create note: ${e}`);
  }
}

// ===== PROMPT + CREATE (combines modal + action) =====

export async function promptAndCreateFolder(
  app: App,
  basePath: string,
): Promise<void> {
  const name = await promptForName(app, "New Folder", "Enter folder name");
  if (!name) return;
  await createFolderWithNote(app, basePath, name);
}

export async function promptAndCreateNote(
  app: App,
  basePath: string,
): Promise<void> {
  const name = await promptForName(app, "New Note", "Enter note name");
  if (!name) return;
  await createNewNote(app, basePath, name);
}

export async function openOrCreateFolderNote(
  app: App,
  folder: TFolder,
  sourcePath = "",
  newLeaf = false,
  homePageSettings: HomePageSettings = {
    useHomePage: true,
    homePageName: "",
  },
): Promise<void> {
  if (folder.isRoot()) {
    await openHomePage(app, homePageSettings, sourcePath, newLeaf);
    return;
  }
  const parent = folder.parent;
  if (parent) {
    const parentNotePath =
      parent.path === "/"
        ? `${folder.name}.md`
        : `${parent.path}/${folder.name}.md`;
    const parentNote = app.vault.getAbstractFileByPath(parentNotePath);
    if (parentNote instanceof TFile) {
      void app.workspace.openLinkText(parentNote.path, sourcePath, newLeaf);
      return;
    }
  }

  const folderNotePath = `${folder.path}/${folder.name}.md`;
  const existing = app.vault.getAbstractFileByPath(folderNotePath);
  if (existing instanceof TFile) {
    void app.workspace.openLinkText(existing.path, sourcePath, newLeaf);
    return;
  }

  try {
    const created = await app.vault.create(folderNotePath, FOLDERNOTE_TEMPLATE);
    void app.workspace.openLinkText(created.path, sourcePath, newLeaf);
  } catch (err) {
    new Notice(`Failed to create folder note: ${err}`);
  }
}

export async function goToParentFolderNote(
  app: App,
  homePageSettings: HomePageSettings,
  sourcePath = "",
  newLeaf = false,
): Promise<void> {
  const target = resolveParentNavigationTarget(
    app,
    homePageSettings,
    sourcePath,
  );

  if (target === "home") {
    await openHomePage(app, homePageSettings, sourcePath, newLeaf);
    return;
  }

  if (!target) {
    return;
  }

  await openOrCreateFolderNote(
    app,
    target,
    sourcePath,
    newLeaf,
    homePageSettings,
  );
}

export async function openHomePage(
  app: App,
  settings: HomePageSettings,
  sourcePath = "",
  newLeaf = false,
): Promise<void> {
  const configuredName = settings.homePageName.trim();
  if (
    settings.useHomePage &&
    (configuredName.includes("/") || configuredName.includes("\\"))
  ) {
    new Notice("Homepage name must be a root note name, not a path.");
    return;
  }

  const homePagePath = resolveHomePagePath(app, settings);
  if (!homePagePath) {
    return;
  }

  const existing = app.vault.getAbstractFileByPath(homePagePath);
  if (existing instanceof TFile) {
    await app.workspace.openLinkText(existing.path, sourcePath, newLeaf);
    return;
  }

  if (existing) {
    new Notice(`Homepage path is not a note: ${homePagePath}`);
    return;
  }

  try {
    const created = await app.vault.create(homePagePath, HOME_PAGE_TEMPLATE);
    await app.workspace.openLinkText(created.path, sourcePath, newLeaf);
  } catch (err) {
    new Notice(`Failed to create homepage: ${err}`);
  }
}
