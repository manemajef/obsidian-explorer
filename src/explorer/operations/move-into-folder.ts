import { App, normalizePath, Notice, TFolder } from "obsidian";
import { ConfirmationDialog } from "../../ui/modals/prompt-modal";
import { canMoveIntoFolder } from "../domain/move-target";
import { moveVaultEntry } from "../vault/entry-move";
import { executeMoveIntoFolder } from "../domain/move-confirmation";

export async function movePathIntoFolder(input: {
  app: App;
  sourcePath: string;
  target: TFolder;
  fromFolderNote: boolean;
}): Promise<boolean> {
  const source = input.app.vault.getAbstractFileByPath(input.sourcePath);
  if (!source) {
    new Notice("Could not move item: it no longer exists.");
    return false;
  }
  if (input.fromFolderNote && !(source instanceof TFolder)) return false;
  if (
    !canMoveIntoFolder(
      {
        path: source.path,
        parent: source.parent,
        isFolder: source instanceof TFolder,
      },
      input.target,
    )
  ) {
    return false;
  }

  const destinationPath = normalizePath(
    `${input.target.path}/${source.name}`,
  );
  if (input.app.vault.getAbstractFileByPath(destinationPath)) {
    new Notice(
      `Could not move ${source.name}: an item with that name already exists.`,
    );
    return false;
  }

  return executeMoveIntoFolder({
    confirmMove: () =>
      input.fromFolderNote
        ? confirmFolderMove(input.app, source.name, input.target.name)
        : Promise.resolve(true),
    move: async () => {
      const result = await moveVaultEntry(
        input.app,
        source,
        destinationPath,
      );
      if (result.kind === "moved") return true;
      new Notice(
        `Could not move ${source.name}: ${String(result.error)}`,
      );
      return false;
    },
  });
}

function confirmFolderMove(
  app: App,
  sourceName: string,
  targetName: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    new ConfirmationDialog(
      app,
      "Move folder?",
      () => resolve(true),
      undefined,
      `This is a folder note. Dragging it to ${targetName} will move the folder ${sourceName} there.`,
      () => resolve(false),
    ).open();
  });
}
