import { App, TFolder, type WorkspaceLeaf } from "obsidian";
import type { BlockSettings } from "../settings";
import { getFolderNotePath } from "../vault/folder-note-file";
import { markNavigationPending } from "../data/navigation-pending";

export const VIRTUAL_FOLDER_NOTE_VIEW_TYPE = "explorer-virtual-folder-note";

type FileFreeFolderPageState = {
  folderPath: string;
  sourcePath?: string;
  title?: string;
  initialOverrides?: Partial<BlockSettings>;
};

export async function openFileFreeFolderPage(
  app: App,
  folder: TFolder,
  newLeaf = false,
): Promise<void> {
  await openFileFreeFolderPageInLeaf(
    app,
    app.workspace.getLeaf(newLeaf),
    { folderPath: folder.path },
    getFolderNotePath(folder),
  );
}

export async function openFileFreeFolderPageInLeaf(
  app: App,
  leaf: WorkspaceLeaf,
  state: FileFreeFolderPageState,
  pendingPath?: string,
): Promise<void> {
  if (pendingPath) markNavigationPending(pendingPath);
  await leaf.setViewState({
    type: VIRTUAL_FOLDER_NOTE_VIEW_TYPE,
    active: true,
    state,
  });
  app.workspace.setActiveLeaf(leaf, { focus: true });
}
