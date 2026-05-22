import { App, MarkdownPostProcessorContext, TFile } from "obsidian";
import { BlockSettings, serializeSettings } from "./settings";

function formatExplorerBlock(
  settings: BlockSettings,
  defaultSettings: BlockSettings,
): string {
  const yaml = serializeSettings(settings, defaultSettings);
  return yaml ? `\`\`\`explorer\n${yaml}\n\`\`\`` : "```explorer\n```";
}

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
  const newContent = sectionInfo
    ? replaceSection(content, sectionInfo.lineStart, sectionInfo.lineEnd, newBlock)
    : content.replace(/```explorer\n[\s\S]*?```/, newBlock);

  if (newContent !== content) await app.vault.modify(file, newContent);
}

function replaceSection(
  content: string,
  lineStart: number,
  lineEnd: number,
  replacement: string,
): string {
  const lines = content.split("\n");
  return [
    ...lines.slice(0, lineStart),
    replacement,
    ...lines.slice(lineEnd + 1),
  ].join("\n");
}
