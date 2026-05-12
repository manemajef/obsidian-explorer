import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App, TFile } from "obsidian";
import { BlockSettings } from "../../settings/schema";
import {
  computeFileListing,
  resolveCardFooterMode,
} from "../../backend/file-listing";
import { usePaginationBounds, usePaginationState } from "./use-pagination-state";
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
  const activePage = search.mode ? search.page : normalPagination.page;

  const wrapPageFileInfos = useCallback(
    (page: typeof activeListing.pageFileInfos) =>
      page.map((fileInfo) => ({
        ...fileInfo,
        togglePin: () => {
          fileInfo.togglePin();
          window.setTimeout(refresh, 100);
        },
      })),
    [refresh],
  );

  const pageFileInfos = useMemo(
    () => wrapPageFileInfos(activeListing.pageFileInfos),
    [activeListing.pageFileInfos, wrapPageFileInfos],
  );

  const [visiblePageFileInfoChunks, setVisiblePageFileInfoChunks] = useState<
    typeof pageFileInfos[]
  >([]);
  const [animatedChunkIndex, setAnimatedChunkIndex] = useState<number | null>(
    null,
  );
  const activePageRef = useRef(activePage);
  const shouldAnimateNextChunkRef = useRef(false);

  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  const browseListingKey = useMemo(
    () => ({
      mode: "browse",
      files: normalSourceFiles,
      settings,
    }),
    [normalSourceFiles, settings],
  );

  const listingKey = search.mode
    ? search.listingKey
    : browseListingKey;

  useEffect(() => {
    setVisiblePageFileInfoChunks([]);
    setAnimatedChunkIndex(null);
    shouldAnimateNextChunkRef.current = false;
    if (activePageRef.current !== 0) {
      if (search.mode) {
        search.setPage(0);
      } else {
        normalPagination.setPage(0);
      }
    }
  }, [listingKey, normalPagination.setPage, search.mode, search.setPage]);

  useEffect(() => {
    setVisiblePageFileInfoChunks((current) => {
      const next = current.slice(0, activePage);
      next[activePage] = pageFileInfos;
      return next;
    });
    setAnimatedChunkIndex(
      shouldAnimateNextChunkRef.current ? activePage : null,
    );
    shouldAnimateNextChunkRef.current = false;
  }, [activePage, pageFileInfos]);

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

  const loadMore = useCallback(() => {
    shouldAnimateNextChunkRef.current = true;
    if (search.mode) {
      search.loadMore();
    } else {
      normalPagination.loadMore();
    }
  }, [search.mode, search.loadMore, normalPagination.loadMore]);

  const extForCard = useMemo(() => resolveCardFooterMode(settings), [settings]);

  return {
    searchMode: search.mode,
    searchQuery: search.query,
    isSearchLoading: search.isLoading,
    toggleSearch: search.toggleSearch,
    setSearchQuery: search.setSearchQuery,
    currentPage: activePage,
    setCurrentPage,
    pageFileInfos,
    visiblePageFileInfoChunks,
    animatedChunkIndex,
    loadMore,
    canLoadMore: activePage + 1 < activeListing.totalPages,
    refresh,
    totalPages: activeListing.totalPages,
    usePaging: activeListing.usePaging,
    extForCard,
  };
}
