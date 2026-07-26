import {
  App,
  MarkdownPostProcessorContext,
  TFile,
} from "obsidian";
import type { BlockSettings } from "../settings";
import { replaceExplorerBlock } from "../domain/explorer-block-content";
import { formatExplorerBlock } from "../domain/explorer-block";
import { writeFileContent } from "../vault/file-content";

export async function updateExplorerBlock(input: {
  app: App;
  container: HTMLElement;
  context: MarkdownPostProcessorContext;
  sourcePath: string;
  defaultSettings: BlockSettings;
  settings: BlockSettings;
}): Promise<void> {
  const file = input.app.vault.getAbstractFileByPath(input.sourcePath);
  if (!(file instanceof TFile)) return;

  const content = await input.app.vault.read(file);
  const section = input.context.getSectionInfo(input.container);
  const replacement = formatExplorerBlock(
    input.settings,
    input.defaultSettings,
  );
  const updated = replaceExplorerBlock(content, replacement, section);
  if (updated === content) return;
  await writeFileContent(input.app, file, updated);
}
