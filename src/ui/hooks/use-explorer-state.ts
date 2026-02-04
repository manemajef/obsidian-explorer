import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App, TFile } from "obsidian";
import { ExplorerSettings } from "../../types";
import {
  computeFileListing,
  resolveCardFooterMode,
} from "../../backend/file-listing";

interface UseExplorerStateOptions {
  app: App;
  depthFiles: TFile[];
  folderNotes: TFile[];
  settings: ExplorerSettings;
  getAllFiles: () => Promise<TFile[]>;
}

export function useExplorerState(options: UseExplorerStateOptions) {
  const { app, depthFiles, folderNotes, settings, getAllFiles } = options;

  // =============================================================================
  // NORMAL VIEW STATE (completely separate from search)
  // =============================================================================
  const [normalPage, setNormalPage] = useState(0);

  // Normal view: depthFiles + folder notes when folders hidden
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
        page: normalPage,
        sortBy: settings.sortBy,
      }),
    [app, normalSourceFiles, settings, normalPage],
  );

  // Reset normal page if out of bounds
  useEffect(() => {
    if (normalPage > 0 && normalPage >= normalListing.totalPages) {
      setNormalPage(Math.max(normalListing.totalPages - 1, 0));
    }
  }, [normalPage, normalListing.totalPages]);

  // =============================================================================
  // SEARCH STATE (completely separate from normal view)
  // =============================================================================
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchPage, setSearchPage] = useState(0);
  const [allFiles, setAllFiles] = useState<TFile[] | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const loadingRef = useRef(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 80);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Lazy load all files when search opens
  useEffect(() => {
    if (!searchMode) {
      // Don't clear allFiles immediately - keep cached for quick re-open
      setIsSearchLoading(false);
      loadingRef.current = false;
      return;
    }

    if (allFiles || loadingRef.current) return;

    loadingRef.current = true;
    setIsSearchLoading(true);

    void getAllFiles()
      .then((files) => setAllFiles(files))
      .catch(() => {
        /* search load failed silently */
      })
      .finally(() => {
        loadingRef.current = false;
        setIsSearchLoading(false);
      });
  }, [searchMode, allFiles, getAllFiles]);

  const searchListing = useMemo(
    () =>
      computeFileListing({
        app,
        files: allFiles ?? [],
        settings,
        query: debouncedQuery,
        page: searchPage,
        // Keep current behavior: search results are ranked by recent edit.
        sortBy: "edited",
      }),
    [app, allFiles, settings, debouncedQuery, searchPage],
  );

  // Reset search page if out of bounds
  useEffect(() => {
    if (searchPage > 0 && searchPage >= searchListing.totalPages) {
      setSearchPage(Math.max(searchListing.totalPages - 1, 0));
    }
  }, [searchPage, searchListing.totalPages]);

  // =============================================================================
  // UNIFIED OUTPUT (switch between normal and search)
  // =============================================================================
  const totalPages = searchMode
    ? searchListing.totalPages
    : normalListing.totalPages;
  const usePaging = searchMode
    ? searchListing.usePaging
    : normalListing.usePaging;
  const currentPage = searchMode ? searchPage : normalPage;

  const setCurrentPage = useCallback(
    (page: number) => {
      if (searchMode) {
        setSearchPage(page);
      } else {
        setNormalPage(page);
      }
    },
    [searchMode],
  );

  // =============================================================================
  // CARD EXTENSION
  // =============================================================================
  const extForCard = useMemo(() => resolveCardFooterMode(settings), [settings]);

  // =============================================================================
  // ACTIONS
  // =============================================================================
  const toggleSearch = useCallback(() => {
    setSearchMode((prev) => {
      if (prev) {
        // Closing search
        setSearchQuery("");
        setDebouncedQuery("");
        setSearchPage(0);
        // Keep allFiles cached for instant re-open
        setTimeout(() => {
          document.getElementById("explorer-actions")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 50);
      } else {
        // Opening search
        setTimeout(() => {
          document.getElementById("explorer-searchbar")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 50);
      }
      return !prev;
    });
  }, []);

  const handleSearchInput = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchPage(0); // Reset to first page on new query
  }, []);

  return {
    // Search
    searchMode,
    searchQuery,
    isSearchLoading,
    toggleSearch,
    setSearchQuery: handleSearchInput,

    // Pagination (unified - switches based on mode)
    currentPage,
    setCurrentPage,

    // Computed (unified - switches based on mode)
    pageFileInfos: searchMode
      ? searchListing.pageFileInfos
      : normalListing.pageFileInfos,
    totalPages,
    usePaging,
    extForCard,
  };
}
