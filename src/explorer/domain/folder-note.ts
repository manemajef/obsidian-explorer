import { TFile } from "obsidian";

export const FOLDERNOTE_TEMPLATE = "\n```explorer\n```\n";

export function isFolderNote(file: TFile): boolean {
  if (!file.parent) return false;
  return file.basename === file.parent.name;
}
