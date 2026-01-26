import { useEffect, useState } from "react";
import { TFile } from "obsidian";
import { GetAllContentOptions } from "../../services/folder-index";

type UseExplorerSearchOptions = {
  getAllFiles: (options?: GetAllContentOptions) => Promise<TFile[]>;
  clearOnClose?: boolean;
};

export function useExplorerSearch(options: UseExplorerSearchOptions) {
  const { getAllFiles, clearOnClose = true } = options;
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allFiles, setAllFiles] = useState<TFile[] | null>(null);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  const toggleSearch = (): void => {
    setSearchMode((prev) => {
      const next = !prev;
      if (!next) {
        setSearchQuery("");
        if (clearOnClose) {
          setAllFiles(null);
        }
      }
      return next;
    });
  };

  useEffect(() => {
    if (!searchMode) return;
    if (allFiles || isLoadingAll) return;

    let isCancelled = false;
    const controller = new AbortController();
    setIsLoadingAll(true);

    const collected: TFile[] = [];
    void getAllFiles({
      onBatch: (batch) => {
        if (isCancelled) return;
        collected.push(...batch);
        setAllFiles([...collected]);
      },
      signal: controller.signal,
    })
      .then((files) => {
        if (!isCancelled) {
          setAllFiles(files);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingAll(false);
        }
      });

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [allFiles, getAllFiles, isLoadingAll, searchMode]);

  return {
    searchMode,
    searchQuery,
    setSearchQuery,
    toggleSearch,
    allFiles,
    isLoadingAll,
  };
}
