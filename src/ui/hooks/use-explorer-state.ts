import { useCallback, useMemo, useState } from "react";
import { App, TFile } from "obsidian";
import { BlockSettings } from "../../settings/schema";
import {
  computeFileListing,
  resolveCardFooterMode,
} from "../../backend/file-listing";
import {
  usePaginationBounds,
  usePaginationState,
} from "./use-pagination-state";
import { useSearchState } from "./use-search-state";

interface UseExplorerStateOptions {
  app: App;
  depthFiles: TFile[];
  folderNotes: TFile[];
  settings: BlockSettings;
  getAllFiles: () => Promise<TFile[]>;
}

export function useExplorerState(options: UseExplorerStateOptions) {
  const { app, depthFiles, folderNotes, settings, getAllFiles } = options;

  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const normalPagination = usePaginationState();
  const normalSourceFiles = useMemo(() => {
    return settings.showFolders ? depthFiles : [...folderNotes, ...depthFiles];
  }, [depthFiles, folderNotes, settings.showFolders]);

  const normalListing = useMemo(
    () =>
      computeFileListing({
        app,
        files: normalSourceFiles,
        settings,
        query: "",
        page: normalPagination.page,
        sortBy: settings.sortBy,
      }),
    [app, normalSourceFiles, settings, normalPagination.page, tick],
  );

  usePaginationBounds(
    normalPagination.page,
    normalPagination.setPage,
    normalListing.totalPages,
  );

  const search = useSearchState({
    app,
    settings,
    getAllFiles,
    tick,
  });

  const activeListing = search.mode ? search.listing : normalListing;

  const pageFileInfos = useMemo(
    () =>
      activeListing.pageFileInfos.map((fileInfo) => ({
        ...fileInfo,
        togglePin: () => {
          fileInfo.togglePin();
          setTimeout(refresh, 100);
        },
      })),
    [activeListing.pageFileInfos, refresh],
  );

  const currentPage = search.mode ? search.page : normalPagination.page;

  const setCurrentPage = useCallback(
    (page: number) => {
      if (search.mode) {
        search.setPage(page);
      } else {
        normalPagination.setPage(page);
      }
    },
    [search.mode, search.setPage, normalPagination.setPage],
  );

  const extForCard = useMemo(() => resolveCardFooterMode(settings), [settings]);

  return {
    searchMode: search.mode,
    searchQuery: search.query,
    isSearchLoading: search.isLoading,
    toggleSearch: search.toggleSearch,
    setSearchQuery: search.setSearchQuery,
    currentPage,
    setCurrentPage,
    pageFileInfos,
    refresh,
    totalPages: activeListing.totalPages,
    usePaging: activeListing.usePaging,
    extForCard,
  };
}
