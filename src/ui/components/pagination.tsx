import React, { useRef } from "react";
import { Platform } from "obsidian";
import { Icon } from "./shared";
import { Divider, Group } from "./ui/layout";
import { cn } from "./ui/action";
import { GlassSurface } from "./ui/glass";
const PAGING_LABEL_BASE = "paging-label";
const PAGING_ICON_CLASS = `${PAGING_LABEL_BASE} paging-icon`;
const PAGING_NUM_CLASS = `${PAGING_LABEL_BASE} paging-num`;

function PageNav(props: {
  icon: "chevron-left" | "chevron-right";
  onClick: () => void;
  disabled?: boolean;
}): React.JSX.Element {
  const { icon, onClick } = props;
  return (
    <span
      className={cn(PAGING_ICON_CLASS)}
      style={{ opacity: props.disabled ? 0.2 : 1 }}
      onClick={onClick}
    >
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
  const activeClass = active ? " active-page" : "";
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
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  useGlass?: boolean;
};

type PaginationModernProps = {
  canLoadMore: boolean;
  onLoadMore: () => void;
  useGlass?: boolean;
};

export function PaginationModern(
  props: PaginationModernProps,
): React.JSX.Element {
  const { canLoadMore, onLoadMore, useGlass } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);

  const Container = useGlass ? GlassSurface : "button";

  return (
    <Group justify="center">
      <Container
        ref={buttonRef}
        type="button"
        className="clickable-icon paging-load-more"
        {...(useGlass && { as: "button", shine: true, radius: "pill" })}
        onClick={() => {
          buttonRef.current?.blur();
          onLoadMore();
        }}
        disabled={!canLoadMore}
      >
        <span className="load-more-text">Load more</span>
        <Icon name="chevrons-down" className="paging-load-more-icon" />
      </Container>
    </Group>
  );
}

export function Pagination(props: PaginationProps): React.JSX.Element {
  const { currentPage, totalPages, onPageChange, useGlass } = props;
  const isMobile = Platform.isMobile;
  const page = currentPage;

  const useLeftDots = isMobile ? page > 1 : page > 2;
  const useRightDots = isMobile ? page < totalPages - 2 : page < totalPages - 3;

  const leftPages = [isMobile ? -10000 : page - 2, page - 1].filter(
    (p) => p > 0,
  );
  const rightPages = [page + 1, isMobile ? totalPages + 1 : page + 2].filter(
    (p) => p < totalPages - 1,
  );
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;
  const Container = useGlass ? GlassSurface : "div";

  return (
    <>
      <Divider />
      <Group justify="center">
        <Container
          className="paging-control"
          {...(useGlass && { shine: true, radius: "pill" })}
        >
          <PageNav
            icon="chevron-left"
            disabled={!canGoPrev}
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
            disabled={!canGoNext}
            onClick={() => {
              if (currentPage < totalPages - 1) onPageChange(currentPage + 1);
            }}
          />
        </Container>
      </Group>
    </>
  );
}
