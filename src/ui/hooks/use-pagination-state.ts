import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

export function usePaginationState() {
  const [page, setPage] = useState(0);

  const resetPage = useCallback(() => {
    setPage(0);
  }, []);

  const loadMore = useCallback(() => {
    setPage((current) => current + 1);
  }, []);

  return {
    page,
    setPage,
    resetPage,
    loadMore,
  };
}

export function usePaginationBounds(
  page: number,
  setPage: Dispatch<SetStateAction<number>>,
  totalPages: number,
) {
  useEffect(() => {
    if (page > 0 && page >= totalPages) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [page, setPage, totalPages]);
}
