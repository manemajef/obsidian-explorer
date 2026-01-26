import { App, TFile } from "obsidian";
import { ExplorerSettings, FileInfo } from "../types";
import { getFileInfo, isFolderNote } from "../utils/file-utils";

export function getExtForCard(settings: ExplorerSettings): string {
  if (settings.cardExt !== "default") return settings.cardExt;
  return settings.depth > 0 ? "folder" : "ctime";
}

export function buildFileInfos(app: App, files: TFile[]): FileInfo[] {
  return files.map((file) => getFileInfo(app, file));
}

export function sortPinnedFirst(files: FileInfo[]): FileInfo[] {
  const sorted = [...files];
  sorted.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isFav && !b.isFav) return -1;
    if (!a.isFav && b.isFav) return 1;
    return 0;
  });
  return sorted;
}

export function sortFileInfos(
  files: FileInfo[],
  sortBy: ExplorerSettings["sortBy"],
): FileInfo[] {
  const sorted = [...files];
  switch (sortBy) {
    case "newest":
      sorted.sort((a, b) => b.file.stat.ctime - a.file.stat.ctime);
      break;
    case "oldest":
      sorted.sort((a, b) => a.file.stat.ctime - b.file.stat.ctime);
      break;
    case "edited":
      sorted.sort((a, b) => b.file.stat.mtime - a.file.stat.mtime);
      break;
    case "name":
      sorted.sort((a, b) => a.file.name.localeCompare(b.file.name));
      break;
  }
  return sorted;
}

export function filterFileInfosByQuery(
  files: FileInfo[],
  query: string,
): FileInfo[] {
  if (!query) return files;

  const normalized = query.toLowerCase();

  if (normalized.startsWith("#")) {
    const tag = normalized.slice(1);
    return files.filter((info) => {
      const tags = Array.isArray(info.tags)
        ? info.tags
        : info.tags
          ? [String(info.tags)]
          : [];
      return tags.some((t) => t.toLowerCase().includes(tag));
    });
  }

  if (normalized.startsWith("@")) {
    const searchTerm = normalized.slice(1);
    return files.filter((info) => {
      if (!isFolderNote(info.file)) return false;
      return info.file.basename.toLowerCase().includes(searchTerm);
    });
  }

  return files.filter(
    (info) =>
      info.file.name.toLowerCase().includes(normalized) ||
      info.file.path.toLowerCase().includes(normalized),
  );
}
