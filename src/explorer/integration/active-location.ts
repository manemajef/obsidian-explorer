import type { App } from "obsidian";
import type { ExplorerLocation } from "../domain/explorer-location";
import { getActiveVirtualFolderNote } from "./virtual-folder-note-view";

export function getActiveExplorerLocation(app: App): ExplorerLocation | null {
  const virtualView = getActiveVirtualFolderNote(app);
  const virtualFolder = virtualView?.folder;
  if (virtualView && virtualFolder) {
    return { folder: virtualFolder, path: virtualView.sourcePath, file: null };
  }
  const activeFile = app.workspace.getActiveFile();
  if (!activeFile?.parent) return null;
  return { folder: activeFile.parent, path: activeFile.path, file: activeFile };
}
