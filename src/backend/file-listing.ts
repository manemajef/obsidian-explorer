import { SUPPORTED_EXTENSIONS } from "../constants";
import { ExplorerSettings } from "../types";
import { filterFiles, getFileInfo, sortFiles } from "../utils/file-utils";
import {
  ComputeFileListingInput,
  ComputeFileListingOutput,
} from "./contracts";

function applyFileVisibilityRules(
  files: ComputeFileListingInput["files"],
  settings: ExplorerSettings,
) {
  if (settings.onlyNotes) {
    return files.filter((f) => f.extension === "md" || f.extension === "pdf");
  }

  if (!settings.showUnsupportedFiles) {
    return files.filter((f) =>
      SUPPORTED_EXTENSIONS.includes(f.extension.toLowerCase()),
    );
  }

  return files;
}

export function computeFileListing(
  input: ComputeFileListingInput,
): ComputeFileListingOutput {
  const { app, files, settings, query, page, sortBy } = input;

  const visibleFiles = applyFileVisibilityRules(files, settings);
  const sortedFiles = sortFiles(app, visibleFiles, sortBy);
  const queriedFiles = query ? filterFiles(app, sortedFiles, query) : sortedFiles;

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

export function resolveCardFooterMode(settings: ExplorerSettings): string {
  if (settings.cardExt !== "default") {
    return settings.cardExt;
  }

  return settings.depth > 0 ? "folder" : "ctime";
}

