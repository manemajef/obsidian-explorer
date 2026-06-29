import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExplorerModel } from "../explorer/model";
import { buildExplorerListing } from "../explorer/lib/listing";
import { ExplorerFileNode } from "../explorer/lib/nodes";
import { Platform } from "obsidian";

type PaginationKind = "classic" | "load-more" | "none";

export function useExplorerState(model: ExplorerModel) {
  const { settings } = model;
  const [metadataTick, setMetadataTick] = useState(0);
  const refreshMetadata = useCallback(
    () => setMetadataTick((tick) => tick + 1),
    [],
  );

  const sourceFiles = useMemo(
    // When folder buttons are hidden, folder notes join the file listing.
    () =>
      settings.showFolders
        ? model.files
        : [...model.folderNotes, ...model.files],
    [model.files, model.folderNotes, settings.showFolders],
  );

  const browseListing = useMemo(
    // Build the visible node listing for browse mode.
    () =>
      buildExplorerListing({
        files: sourceFiles,
        settings,
        sourcePath: model.sourcePath,
        query: "",
        sortBy: settings.sortBy,
      }),
    [sourceFiles, settings, model.sourcePath, settings.sortBy, metadataTick],
  );
  const search = useSearchState(model, metadataTick);
  const paginationKind: PaginationKind = search.mode
    ? "load-more"
    : settings.paginationStyle === "modern" || Platform.isMobile
      ? "load-more"
      : settings.paginationStyle;
  const activeFiles = search.mode ? search.listing : browseListing;
  const effectivePageSize = getEffectivePageSize(settings);
  const classic = useClassicPagination(activeFiles, effectivePageSize);
  const loadMore = useIncrementalReveal(activeFiles, effectivePageSize);
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
  return {
    searchMode: search.mode,
    searchQuery: search.query,
    isSearchLoading: search.isLoading,
    toggleSearch: search.toggle,
    setSearchQuery: search.setQuery,
    refreshMetadata,
    ...pagination,
    visibleFiles: pagination.visibleFiles,
  };
}

function useSearchState(model: ExplorerModel, metadataTick: number) {
  const activeDocument = (window as Window & { activeDocument: Document })
    .activeDocument;
  const [mode, setMode] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [allFiles, setAllFiles] = useState<ExplorerFileNode[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    setAllFiles(null);
  }, [model]);

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

    let cancelled = false;

    void model
      .loadAllFiles((chunk) => {
        if (cancelled) return;
        setAllFiles((prev) => (prev ? [...prev, ...chunk] : chunk));
      })
      .then((all) => {
        if (cancelled) return;
        setAllFiles(all);
      })
      .catch(() => undefined)
      .finally(() => {
        if (cancelled) return;
        loadingRef.current = false;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, allFiles, model]);

  const listing = useMemo(
    () =>
      buildExplorerListing({
        files: allFiles ?? [],
        settings: model.settings,
        sourcePath: model.sourcePath,
        query: debouncedQuery,
        sortBy: "edited",
      }),
    [model, allFiles, debouncedQuery, metadataTick],
  );
  const toggle = useCallback(() => {
    setMode((prev) => {
      setQuery("");
      setDebouncedQuery("");
      window.setTimeout(() => {
        activeDocument
          .getElementById(prev ? "explorer-toolbar" : "explorer-searchbar")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      return !prev;
    });
  }, [activeDocument]);

  return { mode, query, isLoading, listing, toggle, setQuery };
}

function useClassicPagination(files: ExplorerFileNode[], pageSize: number) {
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

function useIncrementalReveal(files: ExplorerFileNode[], pageSize: number) {
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

function getEffectivePageSize(
  settings: Pick<
    ExplorerModel["settings"],
    "pageSize" | "view" | "compactCards"
  >,
): number {
  const multiple =
    settings.view === "cards"
      ? settings.compactCards && !Platform.isMobile
        ? 3
        : 2
      : 1;
  return (
    settings.pageSize + ((multiple - (settings.pageSize % multiple)) % multiple)
  );
}

function useFileSignature(files: ExplorerFileNode[]): string {
  return useMemo(() => files.map((file) => file.path).join("\0"), [files]);
}
