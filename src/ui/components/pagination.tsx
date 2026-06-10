import React from "react";
import { Platform } from "obsidian";
import { Button, ButtonGroup } from "./ui/button";
import { Icon } from "./ui/icon";
import { Text } from "./ui/text";
import { Gap, Group } from "./ui/layout";

function PageNav(props: {
  icon: "chevron-left" | "chevron-right";
  onClick: () => void;
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <Button
      className="explorer-paging__nav"
      icon={props.icon}
      shape="circle"
      variant="ghost"
      disabled={props.disabled}
      onClick={props.onClick}
    />
  );
}

function PageNum(props: {
  value: number;
  active?: boolean;
  onClick?: () => void;
}): React.JSX.Element {
  const { value, active = false, onClick } = props;
  return (
    <Button
      className="explorer-paging__num"
      shape="circle"
      variant="ghost"
      selected={active}
      onClick={onClick}
    >
      {value}
    </Button>
  );
}

function PageDots(): React.JSX.Element {
  return (
    <span className="explorer-paging__dots">
      <Icon name="ellipsis" />
    </span>
  );
}

type PaginationProps = {
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
      <Button
        className="explorer-load-more"
        variant="glass"
        shape="pill"
        interactive={canLoadMore}
        disabled={!canLoadMore}
        onClick={(event) => {
          event.currentTarget.blur();
          onLoadMore();
        }}
      >
        <Text role="body" weight="medium">
          Load more
        </Text>
        <Icon name="chevrons-down" className="explorer-load-more__icon" />
      </Button>
    </Group>
  );
}

export function Pagination(props: PaginationProps): React.JSX.Element {
  const { currentPage, totalPages, onPageChange } = props;
  const isMobile = Platform.isMobile;
  const page = currentPage;

  const useLeftDots = isMobile ? page > 1 : page > 2;
  const useRightDots = isMobile ? page < totalPages - 1 : page < totalPages - 3;

  const leftPages = [isMobile ? -10000 : page - 2, page - 1].filter(
    (p) => p > 0,
  );
  const rightPages = [page + 1, isMobile ? totalPages + 1 : page + 2].filter(
    (p) => p < totalPages - 1,
  );
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  return (
    <>
      <Gap size={4} />
      <Group justify="center">
        <ButtonGroup className="explorer-paging">
          <PageNav
            icon="chevron-left"
            disabled={!canGoPrev}
            onClick={() => {
              if (currentPage > 0) onPageChange(currentPage - 1);
            }}
          />

          <div className="explorer-paging__nums">
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
        </ButtonGroup>
      </Group>
    </>
  );
}
