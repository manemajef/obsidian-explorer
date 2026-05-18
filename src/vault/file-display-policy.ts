import { TFile } from "obsidian";
import { DisplayedNotes } from "../settings/schema";

const EXCLUDED_EXTENSIONS = ["png", "jpeg", "jpg"];
const DEFAULT_DISPLAY_EXTENSIONS = ["md", "pdf", "base"];

function extension(file: TFile): string {
  return file.extension.toLowerCase();
}

export function isExcludedExplorerFile(file: TFile): boolean {
  return EXCLUDED_EXTENSIONS.includes(extension(file));
}

export function filterDisplayedFiles(
  files: TFile[],
  displayedNotes: DisplayedNotes,
): TFile[] {
  const visibleFiles = files.filter((file) => !isExcludedExplorerFile(file));

  switch (displayedNotes) {
    case "none":
      return [];
    case "markdown":
      return visibleFiles.filter((file) => extension(file) === "md");
    case "supported":
      return visibleFiles.filter((file) =>
        DEFAULT_DISPLAY_EXTENSIONS.includes(extension(file)),
      );
    case "all":
      return visibleFiles;
  }
}
