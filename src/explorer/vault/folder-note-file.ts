import { App, TFile, TFolder } from "obsidian";
import {
  BlockSettings,
  parseSettings,
  resolveBlockSettings,
} from "../settings";
import { FOLDERNOTE_TEMPLATE } from "../domain/folder-note";

export type WriteFolderNoteResult =
  | { kind: "written"; file: TFile }
  | { kind: "collision"; path: string }
  | { kind: "failed"; error: unknown };

export function getFolderNotePath(folder: TFolder): string {
  return `${folder.path}/${folder.name}.md`;
}

export function getFolderNoteForFolder(
  app: App,
  folder: TFolder,
): TFile | null {
  const file = app.vault.getAbstractFileByPath(getFolderNotePath(folder));
  return file instanceof TFile ? file : null;
}

export async function createFolderNoteFile(
  app: App,
  folder: TFolder,
  content = FOLDERNOTE_TEMPLATE,
): Promise<WriteFolderNoteResult> {
  const existing = getFolderNoteForFolder(app, folder);
  if (existing) return { kind: "written", file: existing };
  return writeFolderNoteFile(app, getFolderNotePath(folder), content);
}

export async function writeFolderNoteFile(
  app: App,
  path: string,
  content: string,
): Promise<WriteFolderNoteResult> {
  const existing = app.vault.getAbstractFileByPath(path);
  if (existing && !(existing instanceof TFile)) {
    return { kind: "collision", path };
  }

  try {
    if (existing instanceof TFile) {
      await app.vault.process(existing, () => content);
      return { kind: "written", file: existing };
    }
    return {
      kind: "written",
      file: await app.vault.create(path, content),
    };
  } catch (error) {
    return { kind: "failed", error };
  }
}

export async function readFolderNoteBlockSettings(
  app: App,
  file: TFile,
  blockDefaults: BlockSettings,
): Promise<BlockSettings> {
  const content = await app.vault.cachedRead(file);
  const source = content.match(/```explorer\s*\n([\s\S]*?)```/)?.[1] ?? "";
  return resolveBlockSettings(blockDefaults, parseSettings(source));
}
