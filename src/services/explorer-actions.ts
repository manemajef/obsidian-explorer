import {
  App,
  MarkdownPostProcessorContext,
  Notice,
  TFile,
} from "obsidian";
import { ExplorerSettings } from "../types";
import { FOLDERNOTE_TEMPLATE } from "../constants";
import { serializeSettings } from "./settings-parser";

export async function updateExplorerBlock(
  app: App,
  container: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  sourcePath: string,
  settings: ExplorerSettings,
): Promise<void> {
  const file = app.vault.getAbstractFileByPath(sourcePath);
  if (!(file instanceof TFile)) return;

  const sectionInfo = ctx.getSectionInfo(container);
  if (!sectionInfo) {
    const content = await app.vault.read(file);
    const newSource = serializeSettings(settings);
    const regex = /```explorer\n[\s\S]*?```/;
    const replacement = newSource
      ? `\`\`\`explorer\n${newSource}\n\`\`\``
      : "```explorer\n```";
    const newContent = content.replace(regex, replacement);
    if (newContent !== content) {
      await app.vault.modify(file, newContent);
    }
    return;
  }

  const content = await app.vault.read(file);
  const lines = content.split("\n");
  const { lineStart, lineEnd } = sectionInfo;

  const newSource = serializeSettings(settings);
  const newBlock = newSource
    ? `\`\`\`explorer\n${newSource}\n\`\`\``
    : "```explorer\n```";

  const newLines = [
    ...lines.slice(0, lineStart),
    newBlock,
    ...lines.slice(lineEnd + 1),
  ];

  const newContent = newLines.join("\n");
  if (newContent !== content) {
    await app.vault.modify(file, newContent);
  }
}

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
