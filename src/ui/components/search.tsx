import React, { useEffect, useRef } from "react";
import { Platform } from "obsidian";
import { ActionButton } from "./ui/action-button";
import { Group } from "./ui/layout";

export function Search(props: {
  searchMode: boolean;
  searchQuery: string;
  onSearchToggle: () => void;
  onSearchInput: (query: string) => void;
}): JSX.Element {
  const { searchMode, searchQuery, onSearchToggle, onSearchInput } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!searchMode) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [searchMode]);

  if (!searchMode) {
    return <ActionButton icon="search" onClick={onSearchToggle} />;
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
      <ActionButton icon="x" onClick={onSearchToggle} className="" />
    </Group>
  );
}
