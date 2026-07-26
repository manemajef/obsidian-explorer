import type { Plugin } from "obsidian";
import type { PluginSettings } from "../settings";
import { syncFolderNoteRename } from "../operations/sync-folder-note-rename";

/**
 * Keeps a folder and its folder note named in lock-step: renaming one renames
 * the other. Only active while the `syncFolderNotes` setting is enabled.
 */
export function registerFolderNoteRenameSync(
  plugin: Plugin,
  getSettings: () => PluginSettings,
): void {
  plugin.registerEvent(
    plugin.app.vault.on("rename", async (file, oldPath) => {
      if (getSettings().syncFolderNotes) {
        await syncFolderNoteRename(plugin.app, file, oldPath);
      }
    }),
  );
}
