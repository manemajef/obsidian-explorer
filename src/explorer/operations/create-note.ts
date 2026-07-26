import { App, Notice } from "obsidian";
import { promptForName } from "../../ui/modals/prompt-modal";
import type { ExplorerLocation } from "../domain/explorer-location";
import type { PluginSettings } from "../settings";
import { createVaultNote } from "../vault/entry-creation";
import { resolveHomePageNoteInboxPath } from "../domain/homepage";

export async function createNote(input: {
  app: App;
  location: ExplorerLocation | null;
  settings: PluginSettings;
}): Promise<boolean> {
  if (!input.location) return false;
  const name = await promptForName(
    input.app,
    "New Note",
    "Enter note name",
  );
  if (!name) return false;

  const basePath = resolveHomePageNoteInboxPath(
    input.app,
    input.settings,
    input.location.path,
    input.location.folder.path,
  );
  const result = await createVaultNote(input.app, basePath, name);
  if (result.kind === "collision") {
    new Notice(`Failed to create note: ${result.path} is not a note.`);
    return false;
  }
  if (result.kind === "failed") {
    new Notice(`Failed to create note: ${String(result.error)}`);
    return false;
  }

  await input.app.workspace.getLeaf(false).openFile(result.entry);
  return true;
}
