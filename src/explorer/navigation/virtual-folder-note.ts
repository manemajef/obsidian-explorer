import { App, TFolder } from "obsidian";

export const VIRTUAL_FOLDER_NOTE_VIEW_TYPE = "explorer-virtual-folder-note";

export async function openVirtualFolderNote(
  app: App,
  folder: TFolder,
  newLeaf = false,
): Promise<void> {
  const leaf = app.workspace.getLeaf(newLeaf);
  await leaf.setViewState({
    type: VIRTUAL_FOLDER_NOTE_VIEW_TYPE,
    active: true,
    state: {
      folderPath: folder.path,
    },
  });
  app.workspace.setActiveLeaf(leaf, { focus: true });
}
