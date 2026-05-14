import { App, TFile } from "obsidian";
import { FileInfo } from "./types";
import { BlockSettings } from "./settings/schema";
import { filterFiles, getFileInfo, sortFiles } from "./utils/file-utils";

export interface ComputeFileListingInput {
  app: App;
  files: TFile[];
  settings: BlockSettings;
  query: string;
  page: number;
  sortBy: BlockSettings["sortBy"];
}

export interface ComputeFileListingOutput {
  pageFiles: TFile[];
  pageFileInfos: FileInfo[];
  totalPages: number;
  usePaging: boolean;
}

/**
 * Per-block visibility: onlyNotes narrows to notes+PDFs, and the file
 * containing the block is always excluded from its own listing.
 * Plugin-level visibility (showUnsupportedFiles) is applied earlier in FolderIndex.
 */
function applyBlockVisibility(
  files: TFile[],
  settings: BlockSettings,
  currPath: string,
): TFile[] {
  const withoutSelf = files.filter((f) => f.path !== currPath);
  if (settings.onlyNotes) {
    return withoutSelf.filter(
      (f) => f.extension === "md" || f.extension === "pdf",
    );
  }
  return withoutSelf;
}

export function computeFileListing(
  input: ComputeFileListingInput,
): ComputeFileListingOutput {
  const { app, files, settings, query, page, sortBy } = input;
  const currPath = app.workspace.getActiveFile()?.path ?? "";
  const visibleFiles = applyBlockVisibility(files, settings, currPath);
  const sortedFiles = sortFiles(app, visibleFiles, sortBy);
  const queriedFiles = query
    ? filterFiles(app, sortedFiles, query)
    : sortedFiles;

  if (!settings.usePagination) {
    return {
      pageFiles: queriedFiles,
      pageFileInfos: queriedFiles.map((f) => getFileInfo(app, f)),
      totalPages: 1,
      usePaging: false,
    };
  }

  const totalPages = Math.ceil(queriedFiles.length / settings.pageSize);
  const start = page * settings.pageSize;
  const pageFiles = queriedFiles.slice(start, start + settings.pageSize);

  return {
    pageFiles,
    pageFileInfos: pageFiles.map((f) => getFileInfo(app, f)),
    totalPages,
    usePaging: queriedFiles.length > settings.pageSize,
  };
}

export function resolveCardFooterMode(settings: BlockSettings): string {
  if (settings.cardExt !== "default") {
    return settings.cardExt;
  }
  return settings.depth > 0 ? "folder" : "ctime";
}
