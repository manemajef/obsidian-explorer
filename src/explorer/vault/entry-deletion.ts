import type { App, TAbstractFile } from "obsidian";

export function deletionCompleted(entryAtOriginalPath: unknown): boolean {
  return entryAtOriginalPath === null;
}

export async function deleteVaultEntry(
  app: App,
  entry: TAbstractFile,
): Promise<boolean> {
  const path = entry.path;
  await app.fileManager.promptForDeletion(entry);
  return deletionCompleted(app.vault.getAbstractFileByPath(path));
}
