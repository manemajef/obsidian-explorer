import { TFile, TFolder } from "obsidian";

export interface ExplorerSettings {
  sortBy: "newest" | "oldest" | "edited" | "name";
  view: "cards" | "list";
  depth: number;
  pageSize: number;
  onlyNotes: boolean;
  showUnsupportedFiles: boolean;
  showFolders: boolean;
  showBreadcrumbs: boolean;
  cardExt: "folder" | "ctime" | "mtime" | "desc" | "none" | "default";
  showNotes: boolean;
  useGlass: boolean;
}

export interface FileInfo {
  file: TFile;
  description?: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface FolderInfo {
  folder: TFolder;
  folderNote: TFile | null;
}
