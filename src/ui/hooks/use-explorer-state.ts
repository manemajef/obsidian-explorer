import { useCallback, useMemo, useState } from "react";
import { App, TFile } from "obsidian";
import { FileInfo } from "../../types";
import { BlockSettings } from "../../settings/schema";
import {
  computeFileListing,
  resolveCardFooterMode,
} from "../../vault/file-listing";
import {
  useClassicPagination,
  useIncrementalReveal,
} from "./use-pagination-state";
import { useSearchState } from "./use-search-state";

interface UseExplorerStateOptions {
  app: App;
  depthFiles: TFile[];
  folderNotes: TFile[];
  settings: BlockSettings;
  getAllFiles: () => Promise<TFile[]>;
}

type ExplorerMode = "browse" | "search";
type PaginationKind = "classic" | "load-more" | "none";

export function useExplorerState(options: UseExplorerStateOptions) {
  const { app, depthFiles, folderNotes, settings, getAllFiles } = options;
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const sourceFiles = useMemo(() => {
    return settings.showFolders ? depthFiles : [...folderNotes, ...depthFiles];
  }, [depthFiles, folderNotes, settings.showFolders]);

  const browseListing = useMemo(
    () =>
      computeFileListing({
        app,
        files: sourceFiles,
        settings,
        query: "",
        sortBy: settings.sortBy,
      }),
    [app, sourceFiles, settings, settings.sortBy, tick],
  );

  const search = useSearchState({
    app,
    settings,
    getAllFiles,
    tick,
  });

  const mode: ExplorerMode = search.mode ? "search" : "browse";
  const paginationMode =
    mode === "search" ? "load-more" : settings.paginationStyle;
  const paginationKind: PaginationKind =
    paginationMode === "modern" ? "load-more" : paginationMode;
  const activeListing = mode === "search" ? search.listing : browseListing;

  const visibleFileInfos = useMemo(
    () => wrapFileInfos(activeListing.fileInfos, refresh),
    [activeListing.fileInfos, refresh],
  );

  const classicPagination = useClassicPagination(
    visibleFileInfos,
    settings.pageSize,
  );
  const incrementalReveal = useIncrementalReveal(
    visibleFileInfos,
    settings.pageSize,
  );

  const pagination = useMemo(() => {
    if (paginationKind === "classic") {
      return classicPagination;
    }

    if (paginationKind === "load-more") {
      return incrementalReveal;
    }

    return {
      visibleFiles: visibleFileInfos,
      canLoadMore: false,
      loadMore: () => undefined,
      paginationKind,
    };
  }, [classicPagination, incrementalReveal, paginationKind, visibleFileInfos]);

  const extForCard = useMemo(() => resolveCardFooterMode(settings), [settings]);

  return {
    searchMode: search.mode,
    searchQuery: search.query,
    isSearchLoading: search.isLoading,
    toggleSearch: search.toggleSearch,
    setSearchQuery: search.setSearchQuery,
    refresh,
    extForCard,
    ...pagination,
  };
}

function wrapFileInfos(files: FileInfo[], refresh: () => void): FileInfo[] {
  return files.map((fileInfo) => ({
    ...fileInfo,
    togglePin: () => {
      fileInfo.togglePin();
      window.setTimeout(refresh, 100);
    },
  }));
}
