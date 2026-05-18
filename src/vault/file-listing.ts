import { App, TFile } from "obsidian";
import { FileInfo } from "../types";
import {
  BlockSettings,
  isPaginationEnabled,
} from "../settings/schema";
import { filterFiles, getFileInfo, sortFiles } from "./file-utils";
import { filterDisplayedFiles } from "./file-display-policy";

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
 * The file containing the block is always excluded from its own listing.
 * Search mode also needs displayed-notes filtering because it walks the full
 * subtree directly.
 */
function applyBlockVisibility(
  files: TFile[],
  settings: BlockSettings,
  currPath: string,
): TFile[] {
  const withoutSelf = files.filter((f) => f.path !== currPath);
  return filterDisplayedFiles(withoutSelf, settings.displayedNotes);
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

  if (!isPaginationEnabled(settings)) {
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
