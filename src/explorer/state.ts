import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TFile } from "obsidian";
import { FileInfo } from "../types";
import { ExplorerModel } from "./model";
import { buildExplorerListing, resolveCardFooterMode } from "./listing";
import { getFileInfo } from "./file-utils";

type PaginationKind = "classic" | "load-more" | "none";

export function useExplorerState(model: ExplorerModel) {
  const { app, settings } = model;
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const sourceFiles = useMemo(
    // jf not showing folder buttons show folder notes in files list
    () =>
      settings.showFolders
        ? model.files
        : [...model.folderNotes, ...model.files],
    [model.files, model.folderNotes, settings.showFolders],
  );

  const browseListing = useMemo(
    // build fileInfo for listed files
    () =>
      buildExplorerListing({
        app,
        files: sourceFiles,
        settings,
        sourcePath: model.sourcePath,
        query: "",
        sortBy: settings.sortBy,
      }),
    [app, sourceFiles, settings, model.sourcePath, settings.sortBy, tick],
  );
  const search = useSearchState(model, tick);
  const paginationKind: PaginationKind = search.mode
    ? "load-more"
    : settings.paginationStyle === "modern"
      ? "load-more"
      : settings.paginationStyle;
  const activeFiles = search.mode ? search.listing : browseListing;
  const classic = useClassicPagination(activeFiles, settings.pageSize);
  const loadMore = useIncrementalReveal(activeFiles, settings.pageSize);
  const pagination =
    paginationKind == "classic"
      ? classic
      : paginationKind == "load-more"
        ? loadMore
        : {
            visibleFiles: activeFiles,
            canLoadMore: false,
            loadMore: () => undefined,
            paginationKind,
          };
  const visibleFiles = useMemo(
    () =>
      withPinRefresh(
        pagination.visibleFiles.map((f) => getFileInfo(app, f)),
        refresh,
      ),
    [app, pagination.visibleFiles, refresh],
  );

  return {
    searchMode: search.mode,
    searchQuery: search.query,
    isSearchLoading: search.isLoading,
    toggleSearch: search.toggle,
    setSearchQuery: search.setQuery,
    refresh,
    extForCard: resolveCardFooterMode(settings),
    ...pagination,
    visibleFiles, // overide the TFile[] visibleFiles array from pagination to a FileInfo[] array
  };
}

function useSearchState(model: ExplorerModel, tick: number) {
  const activeDocument = (window as Window & { activeDocument: Document })
    .activeDocument;
  const [mode, setMode] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [allFiles, setAllFiles] = useState<TFile[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 80);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!mode) {
      setIsLoading(false);
      loadingRef.current = false;
      return;
    }
    if (allFiles || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    void model
      .loadAllFiles()
      .then(setAllFiles)
      .catch(() => undefined)
      .finally(() => {
        loadingRef.current = false;
        setIsLoading(false);
      });
  }, [mode, allFiles, model]);

  const listing = useMemo(
    () =>
      buildExplorerListing({
        app: model.app,
        files: allFiles ?? [],
        settings: model.settings,
        sourcePath: model.sourcePath,
        query: debouncedQuery,
        sortBy: "edited",
      }),
    [model, allFiles, debouncedQuery, tick],
  );
  const toggle = useCallback(() => {
    setMode((prev) => {
      setQuery("");
      setDebouncedQuery("");
      window.setTimeout(() => {
        activeDocument
          .getElementById(prev ? "explorer-actions" : "explorer-searchbar")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      return !prev;
    });
  }, [activeDocument]);

  return { mode, query, isLoading, listing, toggle, setQuery };
}

function useClassicPagination(files: TFile[], pageSize: number) {
  const size = Math.max(1, pageSize);
  const [currentPage, setPage] = useState(0);
  const fileSignature = useFileSignature(files);
  const totalPages = Math.max(1, Math.ceil(files.length / size));

  useEffect(() => setPage(0), [fileSignature, size]);
  useEffect(() => {
    if (currentPage > 0 && currentPage >= totalPages) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [currentPage, totalPages]);

  const start = currentPage * size;
  return {
    visibleFiles: files.slice(start, start + size),
    canLoadMore: false,
    loadMore: () => undefined,
    currentPage,
    totalPages,
    setPage,
    paginationKind: "classic" as const,
  };
}

function useIncrementalReveal(files: TFile[], pageSize: number) {
  const size = Math.max(1, pageSize);
  const [visibleCount, setVisibleCount] = useState(size);
  const fileSignature = useFileSignature(files);

  useEffect(() => setVisibleCount(size), [fileSignature, size]);

  return {
    visibleFiles: files.slice(0, visibleCount),
    canLoadMore: visibleCount < files.length,
    loadMore: useCallback(() => setVisibleCount((n) => n + size), [size]),
    paginationKind: "load-more" as const,
  };
}

function useFileSignature(files: TFile[]): string {
  return useMemo(
    () => files.map((fileInfo) => fileInfo.path).join("\0"),
    [files],
  );
}

function withPinRefresh(files: FileInfo[], refresh: () => void): FileInfo[] {
  return files.map((fileInfo) => ({
    ...fileInfo,
    togglePin: () => {
      fileInfo.togglePin();
      window.setTimeout(refresh, 100);
    },
  }));
}
