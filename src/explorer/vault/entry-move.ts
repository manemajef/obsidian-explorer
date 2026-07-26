import type { App, TAbstractFile } from "obsidian";

export type MoveVaultEntryResult =
  | { kind: "moved" }
  | { kind: "failed"; error: unknown };

export async function moveVaultEntry(
  app: App,
  entry: TAbstractFile,
  destinationPath: string,
): Promise<MoveVaultEntryResult> {
  try {
    await app.fileManager.renameFile(entry, destinationPath);
    return { kind: "moved" };
  } catch (error) {
    return { kind: "failed", error };
  }
}
