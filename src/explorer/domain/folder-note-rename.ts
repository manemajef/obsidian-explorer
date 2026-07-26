export type SyncedRenameDecision =
  | { kind: "skip" }
  | { kind: "collision"; destinationPath: string }
  | { kind: "rename"; destinationPath: string };

export function resolveFolderRenameFromFolderNote(input: {
  extension: string;
  oldPath: string;
  folderName: string;
  folderPath: string;
  parentPath: string;
  fileBasename: string;
  destinationExists: boolean;
}): SyncedRenameDecision {
  if (input.extension.toLowerCase() !== "md") return { kind: "skip" };
  const oldName = basename(input.oldPath).replace(/\.md$/i, "");
  if (oldName !== input.folderName) return { kind: "skip" };

  const destinationPath = joinPath(
    input.parentPath,
    input.fileBasename,
  );
  if (destinationPath === input.folderPath) return { kind: "skip" };
  return input.destinationExists
    ? { kind: "collision", destinationPath }
    : { kind: "rename", destinationPath };
}

export function resolveFolderNoteRenameFromFolder(input: {
  oldPath: string;
  folderPath: string;
  folderName: string;
  oldFolderNotePath: string | null;
  destinationExists: boolean;
}): SyncedRenameDecision {
  const oldFolderName = basename(input.oldPath);
  if (!oldFolderName || !input.oldFolderNotePath) return { kind: "skip" };

  const destinationPath = joinPath(
    input.folderPath,
    `${input.folderName}.md`,
  );
  if (destinationPath === input.oldFolderNotePath) return { kind: "skip" };
  return input.destinationExists
    ? { kind: "collision", destinationPath }
    : { kind: "rename", destinationPath };
}

function basename(path: string): string {
  return path.split("/").pop() ?? "";
}

function joinPath(parent: string, child: string): string {
  return parent ? `${parent}/${child}` : child;
}
