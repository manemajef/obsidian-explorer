import {
  App,
  MarkdownPostProcessorContext,
  Notice,
  TFile,
  TFolder,
} from "obsidian";
import { ExplorerSettings } from "../../types";
import { FOLDERNOTE_TEMPLATE } from "../../constants";
import { serializeSettings } from "./block-settings";
import { promptForName } from "../../ui/modals/prompt-modal";


// ===== HELPERS =====

function formatExplorerBlock(settings: ExplorerSettings): string {
  const yaml = serializeSettings(settings);
  return yaml ? `\`\`\`explorer\n${yaml}\n\`\`\`` : "```explorer\n```";
}

// ===== BLOCK OPERATIONS =====

export async function updateExplorerBlock(
  app: App,
  container: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  sourcePath: string,
  settings: ExplorerSettings,
): Promise<void> {
  const file = app.vault.getAbstractFileByPath(sourcePath);
  if (!(file instanceof TFile)) return;

  const newBlock = formatExplorerBlock(settings);
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
): Promise<void> {
  if (folder.isRoot()) {
    void app.workspace.openLinkText("Home.md", sourcePath, newLeaf);
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
