import { useCallback, useEffect, useMemo, useState } from "react";
import { FileInfo } from "../../types";

function normalizePageSize(pageSize: number): number {
  return Math.max(1, pageSize);
}

function getFileSignature(files: FileInfo[]): string {
  return files.map((fileInfo) => fileInfo.file.path).join("\0");
}

export function useClassicPagination(files: FileInfo[], pageSize: number) {
  const size = normalizePageSize(pageSize);
  const [currentPage, setPage] = useState(0);
  const fileSignature = useMemo(() => getFileSignature(files), [files]);
  const totalPages = Math.max(1, Math.ceil(files.length / size));

  useEffect(() => {
    setPage(0);
  }, [fileSignature, size]);

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

export function useIncrementalReveal(files: FileInfo[], pageSize: number) {
  const size = normalizePageSize(pageSize);
  const [visibleCount, setVisibleCount] = useState(size);
  const fileSignature = useMemo(() => getFileSignature(files), [files]);

  useEffect(() => {
    setVisibleCount(size);
  }, [fileSignature, size]);

  const loadMore = useCallback(() => {
    setVisibleCount((current) => current + size);
  }, [size]);

  return {
    visibleFiles: files.slice(0, visibleCount),
    canLoadMore: visibleCount < files.length,
    loadMore,
    paginationKind: "load-more" as const,
  };
}
