import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App, TFile } from "obsidian";
import { ExplorerSettings, FileInfo } from "../../types";
import { SUPPORTED_EXTENSIONS } from "../../constants";
import { getFileInfo, sortFiles, filterFiles } from "../../utils/file-utils";

// Dev toggle: true = sort search results by recent edit, false = keep BFS order (closest first)
const SORT_SEARCH_BY_RECENT = true;

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

  // Sort by user preference (operates on TFile[] directly)
  const normalSortedFiles = useMemo(
    () => sortFiles(app, normalSourceFiles, settings.sortBy),
    [app, normalSourceFiles, settings.sortBy],
  );

  // Paginate normal view
  const normalPaginated = useMemo(() => {
    if (!settings.usePagination) {
      return {
        files: normalSortedFiles,
        totalPages: 1,
        usePaging: false,
      };
    }

    const pageSize = settings.pageSize;
    const total = Math.ceil(normalSortedFiles.length / pageSize);
    const start = normalPage * pageSize;

    return {
      files: normalSortedFiles.slice(start, start + pageSize),
      totalPages: total,
      usePaging: normalSortedFiles.length > pageSize,
    };
  }, [normalSortedFiles, settings.pageSize, settings.usePagination, normalPage]);

  // Reset normal page if out of bounds
  useEffect(() => {
    if (normalPage > 0 && normalPage >= normalPaginated.totalPages) {
      setNormalPage(Math.max(normalPaginated.totalPages - 1, 0));
    }
  }, [normalPage, normalPaginated.totalPages]);

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

    getAllFiles()
      .then((files) => setAllFiles(files))
      .finally(() => {
        loadingRef.current = false;
        setIsSearchLoading(false);
      });
  }, [searchMode, allFiles, getAllFiles]);

  // Filter all files by extension settings
  const filteredAllFiles = useMemo(() => {
    if (!allFiles) return [];

    if (settings.onlyNotes) {
      return allFiles.filter(
        (f) => f.extension === "md" || f.extension === "pdf",
      );
    }
    if (!settings.showUnsupportedFiles) {
      return allFiles.filter((f) =>
        SUPPORTED_EXTENSIONS.includes(f.extension.toLowerCase()),
      );
    }
    return allFiles;
  }, [allFiles, settings.onlyNotes, settings.showUnsupportedFiles]);

  // Sort search results (operates on TFile[] directly)
  const searchSortedFiles = useMemo(() => {
    if (SORT_SEARCH_BY_RECENT) {
      return sortFiles(app, filteredAllFiles, "edited");
    }
    return filteredAllFiles;
  }, [app, filteredAllFiles]);

  // Filter by query, then paginate (operates on TFile[])
  const searchPaginated = useMemo(() => {
    const filtered = debouncedQuery
      ? filterFiles(app, searchSortedFiles, debouncedQuery)
      : searchSortedFiles;

    if (!settings.usePagination) {
      return {
        files: filtered,
        totalPages: 1,
        usePaging: false,
      };
    }

    const pageSize = settings.pageSize;
    const total = Math.ceil(filtered.length / pageSize);
    const start = searchPage * pageSize;

    return {
      files: filtered.slice(start, start + pageSize),
      totalPages: total,
      usePaging: filtered.length > pageSize,
    };
  }, [
    app,
    searchSortedFiles,
    debouncedQuery,
    settings.pageSize,
    settings.usePagination,
    searchPage,
  ]);

  // Reset search page if out of bounds
  useEffect(() => {
    if (searchPage > 0 && searchPage >= searchPaginated.totalPages) {
      setSearchPage(Math.max(searchPaginated.totalPages - 1, 0));
    }
  }, [searchPage, searchPaginated.totalPages]);

  // =============================================================================
  // UNIFIED OUTPUT (switch between normal and search)
  // =============================================================================
  // Convert only the displayed page of TFiles to FileInfo (cheap: ~pageSize items)
  const displayedTFiles = searchMode
    ? searchPaginated.files
    : normalPaginated.files;

  const displayedFiles = useMemo<FileInfo[]>(
    () => displayedTFiles.map((f) => getFileInfo(app, f)),
    [app, displayedTFiles],
  );

  const totalPages = searchMode
    ? searchPaginated.totalPages
    : normalPaginated.totalPages;
  const usePaging = searchMode
    ? searchPaginated.usePaging
    : normalPaginated.usePaging;
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
  const extForCard = useMemo(() => {
    if (settings.cardExt !== "default") return settings.cardExt;
    return settings.depth > 0 ? "folder" : "ctime";
  }, [settings.cardExt, settings.depth]);

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
    pageFileInfos: displayedFiles,
    totalPages,
    usePaging,
    extForCard,
  };
}
