import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App, TFile } from "obsidian";
import { ExplorerSettings } from "../../types";
import { computeFileListing } from "../../backend/file-listing";
import { usePaginationBounds, usePaginationState } from "./use-pagination-state";

interface UseSearchStateOptions {
  app: App;
  settings: ExplorerSettings;
  getAllFiles: () => Promise<TFile[]>;
}

export function useSearchState(options: UseSearchStateOptions) {
  const { app, settings, getAllFiles } = options;

  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [allFiles, setAllFiles] = useState<TFile[] | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const loadingRef = useRef(false);
  const pagination = usePaginationState();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 80);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!searchMode) {
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
        // Silent: search should remain usable even if background preload fails.
      })
      .finally(() => {
        loadingRef.current = false;
        setIsSearchLoading(false);
      });
  }, [searchMode, allFiles, getAllFiles]);

  const listing = useMemo(
    () =>
      computeFileListing({
        app,
        files: allFiles ?? [],
        settings,
        query: debouncedQuery,
        page: pagination.page,
        // Keep current behavior: search results are ranked by recent edit.
        sortBy: "edited",
      }),
    [app, allFiles, settings, debouncedQuery, pagination.page],
  );

  usePaginationBounds(pagination.page, pagination.setPage, listing.totalPages);

  const toggleSearch = useCallback(() => {
    setSearchMode((prev) => {
      if (prev) {
        setSearchQuery("");
        setDebouncedQuery("");
        pagination.resetPage();
        setTimeout(() => {
          document.getElementById("explorer-actions")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 50);
      } else {
        setTimeout(() => {
          document.getElementById("explorer-searchbar")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 50);
      }
      return !prev;
    });
  }, [pagination]);

  const handleSearchInput = useCallback(
    (query: string) => {
      setSearchQuery(query);
      pagination.resetPage();
    },
    [pagination],
  );

  return {
    mode: searchMode,
    query: searchQuery,
    isLoading: isSearchLoading,
    listing,
    page: pagination.page,
    setPage: pagination.setPage,
    toggleSearch,
    setSearchQuery: handleSearchInput,
  };
}

