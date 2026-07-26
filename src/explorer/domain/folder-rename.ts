export type FolderRenameResult =
  | { kind: "renamed" }
  | { kind: "folder-rename-failed"; error: unknown }
  | { kind: "folder-note-missing"; rollbackFailed: boolean }
  | {
      kind: "folder-note-rename-failed";
      error: unknown;
      rollbackFailed: boolean;
    };

type RenameResult =
  | { kind: "renamed" }
  | { kind: "failed"; error: unknown };

export async function executeFolderRename<TFolderNote>(input: {
  hasFolderNote: boolean;
  renameFolder: () => Promise<RenameResult>;
  findMovedFolderNote: () => TFolderNote | null;
  renameFolderNote: (file: TFolderNote) => Promise<RenameResult>;
  rollBackFolder: () => Promise<RenameResult>;
}): Promise<FolderRenameResult> {
  const folderResult = await input.renameFolder();
  if (folderResult.kind === "failed") {
    return {
      kind: "folder-rename-failed",
      error: folderResult.error,
    };
  }
  if (!input.hasFolderNote) return { kind: "renamed" };

  const movedFolderNote = input.findMovedFolderNote();
  if (!movedFolderNote) {
    return {
      kind: "folder-note-missing",
      rollbackFailed: (await input.rollBackFolder()).kind === "failed",
    };
  }

  const noteResult = await input.renameFolderNote(movedFolderNote);
  if (noteResult.kind === "renamed") return { kind: "renamed" };
  return {
    kind: "folder-note-rename-failed",
    error: noteResult.error,
    rollbackFailed: (await input.rollBackFolder()).kind === "failed",
  };
}
