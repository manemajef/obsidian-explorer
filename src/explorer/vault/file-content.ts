import type { App, TFile } from "obsidian";

export async function writeFileContent(
  app: App,
  file: TFile,
  content: string,
): Promise<void> {
  await app.vault.modify(file, content);
}
