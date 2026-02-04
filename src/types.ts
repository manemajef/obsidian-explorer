import { TFile, TFolder } from "obsidian";

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
