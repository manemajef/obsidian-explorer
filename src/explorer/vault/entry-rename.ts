import type { App, TAbstractFile, TFile, TFolder } from "obsidian";

export type RenameVaultEntryResult =
  | { kind: "renamed" }
  | { kind: "failed"; error: unknown };

export function renameVaultFile(
  app: App,
  file: TFile,
  destinationPath: string,
): Promise<RenameVaultEntryResult> {
  return renameVaultEntry(app, file, destinationPath);
}

export function renameVaultFolder(
  app: App,
  folder: TFolder,
  destinationPath: string,
): Promise<RenameVaultEntryResult> {
  return renameVaultEntry(app, folder, destinationPath);
}

async function renameVaultEntry(
  app: App,
  entry: TAbstractFile,
  destinationPath: string,
): Promise<RenameVaultEntryResult> {
  try {
    await app.fileManager.renameFile(entry, destinationPath);
    return { kind: "renamed" };
  } catch (error) {
    return { kind: "failed", error };
  }
}
