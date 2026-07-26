import type { App, TFile } from "obsidian";

export function isPinned(app: App, file: TFile): boolean {
  return app.metadataCache.getFileCache(file)?.frontmatter?.pin === true;
}

export function resolvePinChange(
  currentPinned: boolean,
  desiredPinned: boolean,
): boolean | null {
  return currentPinned === desiredPinned ? null : desiredPinned;
}
