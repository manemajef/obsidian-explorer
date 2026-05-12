import React, { useEffect, useRef } from "react";
import { Platform } from "obsidian";
import { ActionItem } from "./ui/action";
import { Group } from "./ui/layout";

export function Search(props: {
  searchMode: boolean;
  searchQuery: string;
  onSearchToggle: () => void;
  onSearchInput: (query: string) => void;
  useGlass?: boolean;
}): React.JSX.Element {
  const {
    searchMode,
    searchQuery,
    onSearchToggle,
    onSearchInput,
    useGlass = true,
  } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const activeWindow = (window as Window & { activeWindow: Window }).activeWindow;

  useEffect(() => {
    if (!searchMode) return;
    const timer = activeWindow.setTimeout(() => inputRef.current?.focus(), 50);
    return () => activeWindow.clearTimeout(timer);
  }, [activeWindow, searchMode]);

  if (!searchMode) {
    return <ActionItem glass={useGlass} icon="search" onClick={onSearchToggle} />;
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
        <ActionItem
          glass={useGlass}
          icon="x"
          onClick={onSearchToggle}
          className="cancel-search-btn hover-bg-modifier hover-opacity-100"
        />
      </div>
    </Group>
  );
}
