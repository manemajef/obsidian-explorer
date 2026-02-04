import { App, MarkdownPostProcessorContext, TFile, TFolder } from "obsidian";
import { ExplorerSettings, FileInfo, FolderInfo } from "../types";

export interface BuildRenderModelInput {
  sourcePath: string;
  settings: ExplorerSettings;
}

export interface BuildRenderModelOutput {
  folder: TFolder;
  folderInfos: FolderInfo[];
  depthFiles: TFile[];
  folderNotes: TFile[];
  getAllFiles: () => Promise<TFile[]>;
}

export interface ComputeFileListingInput {
  app: App;
  files: TFile[];
  settings: ExplorerSettings;
  query: string;
  page: number;
  sortBy: ExplorerSettings["sortBy"];
}

export interface ComputeFileListingOutput {
  pageFiles: TFile[];
  pageFileInfos: FileInfo[];
  totalPages: number;
  usePaging: boolean;
}

export interface UpdateBlockSettingsInput {
  container: HTMLElement;
  ctx: MarkdownPostProcessorContext;
  sourcePath: string;
  settings: ExplorerSettings;
}

