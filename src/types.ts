import { TFile, TFolder } from "obsidian";

export interface FileInfo {
  file: TFile;
  description?: string;
  tags?: string[];
  // tagsToDisplay?: string[];
  isPinned?: boolean;
  togglePin: () => void;
}

export interface FolderInfo {
  folder: TFolder;
  folderNote: TFile | null;
}
