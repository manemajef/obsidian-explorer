import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App, TFile } from "obsidian";
import { ExplorerSettings, FileInfo } from "../../types";
import { getFileInfo, sortFiles, filterFiles } from "../../utils/file-utils";

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
  const loadingRef = useRef(false);  // Track loading without triggering re-renders

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

  // ===== SOURCE FILES (with folder notes when folders hidden) =====
  const sourceFiles = useMemo(() => {
    const base = searchMode && allFiles ? allFiles : depthFiles;
    return settings.showFolders ? base : [...folderNotes, ...base];
  }, [searchMode, allFiles, depthFiles, folderNotes, settings.showFolders]);

  // ===== SORTED FILES (expensive - only when source or sort changes) =====
  const sortedFiles = useMemo(
    () => sortFiles(sourceFiles, settings.sortBy),
    [sourceFiles, settings.sortBy]
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
    [app, pageFiles]
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
