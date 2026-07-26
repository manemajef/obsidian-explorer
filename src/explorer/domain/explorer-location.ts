import type { TFile, TFolder } from "obsidian";

/**
 * A place the explorer can be viewing: the folder whose contents are shown,
 * the source path used for link and homepage context, and the source Markdown
 * file when one exists. The file may be an ordinary note; it is not the
 * optional backing of a FolderPage.
 */
export type ExplorerLocation = {
  folder: TFolder;
  path: string;
  file: TFile | null;
};
