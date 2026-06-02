import { Plugin, TFile, TFolder } from "obsidian";
import { FolderDataStore } from "../data/folder-data-store";
import { isFolderNote } from "../lib/folder-note";

/**
 * Keeps the virtual folder-note data store aligned with the vault. Folder
 * renames/moves rewrite stored keys (including descendants, which never fire
 * their own events), deletions drop them, and a newly created Markdown folder
 * note clears any now-redundant virtual entry for its folder.
 */
export function registerFolderDataSync(
  plugin: Plugin,
  store: FolderDataStore,
): void {
  plugin.registerEvent(
    plugin.app.vault.on("rename", (file, oldPath) => {
      if (file instanceof TFolder) store.renamePrefix(oldPath, file.path);
    }),
  );

  plugin.registerEvent(
    plugin.app.vault.on("delete", (file) => {
      if (file instanceof TFolder) store.deletePrefix(file.path);
    }),
  );

  plugin.registerEvent(
    plugin.app.vault.on("create", (file) => {
      if (file instanceof TFile && file.parent && isFolderNote(file)) {
        store.delete(file.parent.path);
      }
    }),
  );
}
