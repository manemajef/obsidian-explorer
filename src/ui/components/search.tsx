import React, { useEffect, useRef } from "react";
import { Platform } from "obsidian";
import { GlassItem } from "./ui/glass";
import { Group } from "./ui/layout";

type SearchItemComponent = React.ElementType<{
  icon: string;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}>;

export function Search(props: {
  searchMode: boolean;
  searchQuery: string;
  onSearchToggle: () => void;
  onSearchInput: (query: string) => void;
  ItemComponent?: SearchItemComponent;
}): React.JSX.Element {
  const {
    searchMode,
    searchQuery,
    onSearchToggle,
    onSearchInput,
    ItemComponent = GlassItem,
  } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!searchMode) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [searchMode]);

  if (!searchMode) {
    return <ItemComponent icon="search" onClick={onSearchToggle} />;
  }

  return (
    <Group className="actions-search">
      <div className="actions-search-input">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={
            Platform.isMobile
              ? "search"
              : "use '#' for tags and '@' for folders"
          }
          value={searchQuery}
          onChange={(e) => onSearchInput(e.target.value)}
        />
      </div>
      <div className="search-x-btn">
        <ItemComponent
          icon="x"
          onClick={onSearchToggle}
          className="cancel-search-btn hover-bg-modifier hover-opacity-100"
        />
      </div>
    </Group>
  );
}
