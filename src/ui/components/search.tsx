import React, { useEffect, useRef } from "react";
import { Platform } from "obsidian";
import { Icon } from "./shared";

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
    return (
      <button
        type="button"
        className="clickable-icon action-icon"
        onClick={onSearchToggle}
      >
        <Icon name="search" />
      </button>
    );
  }

  return (
    <div className="actions-search flex gap-2">
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
      <button
        type="button"
        className="clickable-icon action-icon cancel-search-btn"
        onClick={onSearchToggle}
      >
        <Icon name="undo-2" />
      </button>
    </div>
  );
}
