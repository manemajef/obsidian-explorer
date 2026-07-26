import type { App, TFile } from "obsidian";
import { appendExplorerBlock } from "../domain/explorer-block-content";
import { FOLDERNOTE_TEMPLATE } from "../domain/folder-note";
import { writeFileContent } from "../vault/file-content";

export async function appendExplorerCodeBlockToFile(
  app: App,
  file: TFile,
): Promise<void> {
  const content = await app.vault.read(file);
  await writeFileContent(
    app,
    file,
    appendExplorerBlock(content, FOLDERNOTE_TEMPLATE),
  );
}
