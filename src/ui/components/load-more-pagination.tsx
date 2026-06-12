import React from "react";
import { Button } from "./primitives/button";
import { Icon } from "./primitives/icon";
import { Group } from "./primitives/layout";
import { Text } from "./primitives/text";

type LoadMorePaginationProps = {
  canLoadMore: boolean;
  onLoadMore: () => void;
};

export function LoadMorePagination(
  props: LoadMorePaginationProps,
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
