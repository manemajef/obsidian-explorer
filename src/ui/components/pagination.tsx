import React from "react";
import { App } from "obsidian";
import { Icon } from "./shared";
import { Group } from "./ui/layout";

export function Pagination(props: {
  app: App;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}): React.JSX.Element {
  const { app, currentPage, totalPages, onPageChange } = props;
  const isMobile = (app as App & { isMobile: boolean }).isMobile;
  const page = currentPage;

  const useLeftDots = isMobile ? page > 1 : page > 2;
  const useRightDots = isMobile ? page < totalPages - 2 : page < totalPages - 3;

  const leftPages = [isMobile ? -10000 : page - 2, page - 1].filter(
    (p) => p > 0,
  );
  const rightPages = [page + 1, isMobile ? totalPages + 1 : page + 2].filter(
    (p) => p < totalPages - 1,
  );

  return (
    <Group justify="center">
      <div className="paging-controll">
        <span
          className="paging-label paging-icon"
          onClick={() => {
            if (currentPage > 0) onPageChange(currentPage - 1);
          }}
        >
          <Icon name="chevron-left" />
        </span>

        <div className="paging-controll-nums">
          {page !== 0 ? (
            <span
              className="paging-num paging-label"
              onClick={() => onPageChange(0)}
            >
              1
            </span>
          ) : null}

          {useLeftDots ? (
            <span className="paging-label paging-dots">
              <Icon name="ellipsis" />
            </span>
          ) : null}

          {leftPages.map((p) => (
            <span
              key={p}
              className="paging-label paging-num"
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </span>
          ))}

          <span className="paging-label active-page paging-num">
            {page + 1}
          </span>

          {rightPages.map((p) => (
            <span
              key={p}
              className="paging-label paging-num"
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </span>
          ))}

          {useRightDots ? (
            <span className="paging-label paging-dots">
              <Icon name="ellipsis" />
            </span>
          ) : null}

          {page !== totalPages - 1 ? (
            <span
              className="paging-num paging-label"
              onClick={() => onPageChange(totalPages - 1)}
            >
              {totalPages}
            </span>
          ) : null}
        </div>

        <span
          className="paging-label paging-icon"
          onClick={() => {
            if (currentPage < totalPages - 1) onPageChange(currentPage + 1);
          }}
        >
          <Icon name="chevron-right" />
        </span>
      </div>
    </Group>
  );
}
