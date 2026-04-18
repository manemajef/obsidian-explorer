import React from "react";
import { App } from "obsidian";
import { Icon } from "./shared";
import { Group } from "./ui/layout";

const PAGING_LABEL_BASE = "paging-label tone-muted hover-bg-primary-alt";
const PAGING_ICON_CLASS = `${PAGING_LABEL_BASE} paging-icon`;
const PAGING_NUM_CLASS = `${PAGING_LABEL_BASE} paging-num`;

function PageNav(props: {
  icon: "chevron-left" | "chevron-right";
  onClick: () => void;
}): React.JSX.Element {
  const { icon, onClick } = props;
  return (
    <span className={PAGING_ICON_CLASS} onClick={onClick}>
      <Icon name={icon} />
    </span>
  );
}

function PageNum(props: {
  value: number;
  active?: boolean;
  onClick?: () => void;
}): React.JSX.Element {
  const { value, active = false, onClick } = props;
  const activeClass = active ? " active-page border-strong" : "";
  return (
    <span className={`${PAGING_NUM_CLASS}${activeClass}`} onClick={onClick}>
      {value}
    </span>
  );
}

function PageDots(): React.JSX.Element {
  return (
    <span className={`${PAGING_LABEL_BASE} paging-dots`}>
      <Icon name="ellipsis" />
    </span>
  );
}

type PaginationProps = {
  app: App;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

type PaginationModernProps = {
  canLoadMore: boolean;
  onLoadMore: () => void;
};

export function PaginationModern(
  props: PaginationModernProps,
): React.JSX.Element {
  const { canLoadMore, onLoadMore } = props;
  return (
    <Group justify="center">
      <button
        type="button"
        className="clickable-icon paging-load-more radius-pill border border-hover pad-compact"
        onClick={onLoadMore}
        disabled={!canLoadMore}
      >
        <span>Load more</span>
        <Icon name="chevrons-down" className="paging-load-more-icon" />
      </button>
    </Group>
  );
}

export function Pagination(props: PaginationProps): React.JSX.Element {
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
      <div className="paging-control radius-pill border border-hover pad-compact">
        <PageNav
          icon="chevron-left"
          onClick={() => {
            if (currentPage > 0) onPageChange(currentPage - 1);
          }}
        />

        <div className="paging-control-nums">
          {page !== 0 ? (
            <PageNum value={1} onClick={() => onPageChange(0)} />
          ) : null}

          {useLeftDots ? <PageDots /> : null}

          {leftPages.map((p) => (
            <PageNum key={p} value={p + 1} onClick={() => onPageChange(p)} />
          ))}

          <PageNum value={page + 1} active />

          {rightPages.map((p) => (
            <PageNum key={p} value={p + 1} onClick={() => onPageChange(p)} />
          ))}

          {useRightDots ? <PageDots /> : null}

          {page !== totalPages - 1 ? (
            <PageNum
              value={totalPages}
              onClick={() => onPageChange(totalPages - 1)}
            />
          ) : null}
        </div>

        <PageNav
          icon="chevron-right"
          onClick={() => {
            if (currentPage < totalPages - 1) onPageChange(currentPage + 1);
          }}
        />
      </div>
    </Group>
  );
}
