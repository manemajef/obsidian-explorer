import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";

export function usePaginationState() {
  const [page, setPage] = useState(0);

  const resetPage = useCallback(() => {
    setPage(0);
  }, []);

  return {
    page,
    setPage,
    resetPage,
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
