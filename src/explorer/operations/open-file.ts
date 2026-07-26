import type { App, TFile } from "obsidian";
import { isFolderNote } from "../domain/folder-note";
import {
  resolveFilePresentation,
  type OpenFileRequest,
} from "../domain/file-opening";
import type { PluginSettings } from "../settings";
import { markNavigationPending } from "../data/navigation-pending";

export async function openFile(input: {
  app: App;
  file: TFile;
  sourcePath: string;
  settings: PluginSettings;
  request?: OpenFileRequest;
}): Promise<void> {
  const presentation = resolveFilePresentation({
    isFolderNote: isFolderNote(input.file),
    forceReadingMode: input.settings.forceReadingMode,
    request: input.request,
  });
  if (presentation.markNavigationPending) {
    markNavigationPending(input.file.path);
  }
  await input.app.workspace.openLinkText(
    input.file.path,
    input.sourcePath,
    presentation.newLeaf,
    presentation.forceReadingMode
      ? { state: { mode: "preview" } }
      : undefined,
  );
}
