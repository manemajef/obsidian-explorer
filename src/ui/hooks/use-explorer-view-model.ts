import { useMemo } from "react";
import { App, TFile } from "obsidian";
import { ExplorerSettings, FileInfo } from "../../types";
import {
  buildFileInfos,
  filterFileInfosByQuery,
  getExtForCard,
  sortFileInfos,
  sortPinnedFirst,
} from "../explorer-data";

type ExplorerViewModelArgs = {
  app: App;
  settings: ExplorerSettings;
  depthFiles: TFile[];
  folderNotes: TFile[];
  allFiles: TFile[] | null;
  searchQuery: string;
  currentPage: number;
};

export function useExplorerViewModel(args: ExplorerViewModelArgs) {
  const {
    app,
    settings,
    depthFiles,
    folderNotes,
    allFiles,
    searchQuery,
    currentPage,
  } = args;

  const extForCard = useMemo(() => getExtForCard(settings), [settings]);

  const filesForDepth = useMemo(() => {
    if (settings.showFolders) return depthFiles;
    return [...folderNotes, ...depthFiles];
  }, [depthFiles, folderNotes, settings.showFolders]);

  const allFilesForSearch = useMemo(() => {
    if (!allFiles) return null;
    if (settings.showFolders) return allFiles;
    return [...folderNotes, ...allFiles];
  }, [allFiles, folderNotes, settings.showFolders]);

  const fileInfosDepth = useMemo(
    () => buildFileInfos(app, filesForDepth),
    [app, filesForDepth],
  );

  const fileInfosAll = useMemo(() => {
    if (!allFilesForSearch) return null;
    return buildFileInfos(app, allFilesForSearch);
  }, [app, allFilesForSearch]);

  const fileInfos = searchQuery ? fileInfosAll ?? [] : fileInfosDepth;

  const filtered = useMemo(
    () => filterFileInfosByQuery(fileInfos, searchQuery),
    [fileInfos, searchQuery],
  );

  const sorted = useMemo(
    () => sortFileInfos(filtered, settings.sortBy),
    [filtered, settings.sortBy],
  );

  const sortedPinned = useMemo(() => sortPinnedFirst(sorted), [sorted]);

  const totalPages = Math.ceil(sortedPinned.length / settings.pageSize);
  const usePaging = sortedPinned.length > settings.pageSize;
  const startIdx = currentPage * settings.pageSize;
  const pageFiles = useMemo(
    () =>
      usePaging
        ? sortedPinned.slice(startIdx, startIdx + settings.pageSize)
        : sortedPinned,
    [sortedPinned, startIdx, usePaging, settings.pageSize],
  );

  return {
    extForCard,
    pageFiles,
    totalPages,
    usePaging,
  };
}
