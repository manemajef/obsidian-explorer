import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App, TFile } from "obsidian";
import { ExplorerSettings, FileInfo } from "../../types";
import { SUPPORTED_EXTENSIONS } from "../../constants";
import { getFileInfo, sortFiles, filterFiles } from "../../utils/file-utils";

// Dev toggle: true = only show allFiles when query entered, false = show all immediately on search open
const SEARCH_REQUIRES_QUERY = false;

interface UseExplorerStateOptions {
  app: App;
  depthFiles: TFile[];
  folderNotes: TFile[];
  settings: ExplorerSettings;
  getAllFiles: () => Promise<TFile[]>;
}

export function useExplorerState(options: UseExplorerStateOptions) {
  const { app, depthFiles, folderNotes, settings, getAllFiles } = options;

  // ===== SEARCH STATE =====
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [allFiles, setAllFiles] = useState<TFile[] | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const loadingRef = useRef(false); // Track loading without triggering re-renders

  // ===== PAGINATION STATE =====
  const [currentPage, setCurrentPage] = useState(0);

  // ===== DEBOUNCE SEARCH =====
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ===== LAZY LOAD ALL FILES WHEN SEARCH OPENS =====
  useEffect(() => {
    if (!searchMode) {
      setAllFiles(null);
      setIsSearchLoading(false);
      loadingRef.current = false;
      return;
    }

    // Already have files or already loading - skip
    if (allFiles || loadingRef.current) return;

    loadingRef.current = true;
    setIsSearchLoading(true);

    getAllFiles()
      .then((files) => {
        setAllFiles(files);
      })
      .finally(() => {
        loadingRef.current = false;
        setIsSearchLoading(false);
      });
  }, [searchMode, allFiles, getAllFiles]);

  // ===== FILTERED ALL FILES (apply same filters as depthFiles) =====
  const filteredAllFiles = useMemo(() => {
    if (!allFiles) return null;

    if (settings.onlyNotes) {
      return allFiles.filter(f => f.extension === "md" || f.extension === "pdf");
    }
    if (!settings.showUnsupportedFiles) {
      return allFiles.filter(f => SUPPORTED_EXTENSIONS.includes(f.extension.toLowerCase()));
    }
    return allFiles;
  }, [allFiles, settings.onlyNotes, settings.showUnsupportedFiles]);

  // ===== SOURCE FILES (with folder notes when folders hidden) =====
  const sourceFiles = useMemo(() => {
    // Use allFiles when searching (if SEARCH_REQUIRES_QUERY, only after typing)
    const useAllFiles =
      searchMode && filteredAllFiles && (!SEARCH_REQUIRES_QUERY || debouncedQuery);
    const base = useAllFiles ? filteredAllFiles : depthFiles;
    return settings.showFolders ? base : [...folderNotes, ...base];
  }, [
    searchMode,
    debouncedQuery,
    filteredAllFiles,
    depthFiles,
    folderNotes,
    settings.showFolders,
  ]);

  // ===== SORTED FILES (expensive - only when source or sort changes) =====
  const sortedFiles = useMemo(
    () => sortFiles(sourceFiles, settings.sortBy),
    [sourceFiles, settings.sortBy],
  );

  // ===== FILTERED + PAGINATED (cheap - on query/page change) =====
  const { pageFiles, totalPages, usePaging } = useMemo(() => {
    const filtered = debouncedQuery
      ? filterFiles(sortedFiles, debouncedQuery)
      : sortedFiles;

    const pageSize = settings.pageSize;
    const total = Math.ceil(filtered.length / pageSize);
    const start = currentPage * pageSize;

    return {
      pageFiles: filtered.slice(start, start + pageSize),
      totalPages: total,
      usePaging: filtered.length > pageSize,
    };
  }, [sortedFiles, debouncedQuery, settings.pageSize, currentPage]);

  // ===== FILE INFOS (only for displayed page) =====
  const pageFileInfos = useMemo<FileInfo[]>(
    () => pageFiles.map((f) => getFileInfo(app, f)),
    [app, pageFiles],
  );

  // ===== CARD EXTENSION =====
  const extForCard = useMemo(() => {
    if (settings.cardExt !== "default") return settings.cardExt;
    return settings.depth > 0 ? "folder" : "ctime";
  }, [settings.cardExt, settings.depth]);

  // ===== RESET PAGE WHEN TOTAL CHANGES =====
  useEffect(() => {
    if (currentPage > 0 && currentPage >= totalPages) {
      setCurrentPage(Math.max(totalPages - 1, 0));
    }
  }, [currentPage, totalPages]);

  // ===== ACTIONS =====
  const toggleSearch = useCallback(() => {
    setSearchMode((prev) => {
      if (prev) {
        setSearchQuery("");
        setDebouncedQuery("");
        setAllFiles(null);
        setCurrentPage(0);
      }
      return !prev;
    });
  }, []);

  const handleSearchInput = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(0);
  }, []);

  return {
    // Search
    searchMode,
    searchQuery,
    isSearchLoading,
    toggleSearch,
    setSearchQuery: handleSearchInput,

    // Pagination
    currentPage,
    setCurrentPage,

    // Computed
    pageFileInfos,
    totalPages,
    usePaging,
    extForCard,
  };
}
