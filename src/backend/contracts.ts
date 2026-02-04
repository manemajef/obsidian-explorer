import { App, MarkdownPostProcessorContext, TFile, TFolder } from "obsidian";
import { FileInfo, FolderInfo } from "../types";
import { BlockSettings } from "../settings/schema";

export interface BuildRenderModelInput {
  sourcePath: string;
  settings: BlockSettings;
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

export interface UpdateBlockSettingsInput {
  container: HTMLElement;
  ctx: MarkdownPostProcessorContext;
  sourcePath: string;
  defaultSettings: BlockSettings;
  settings: BlockSettings;
}
