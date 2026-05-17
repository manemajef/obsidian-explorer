import React, { useEffect, useRef } from "react";
import { Platform } from "obsidian";
import { ActionItem } from "./ui/action";

export function Search(props: {
  searchMode: boolean;
  searchQuery: string;
  onSearchToggle: () => void;
  onSearchInput: (query: string) => void;
}): React.JSX.Element {
  const { searchMode, searchQuery, onSearchToggle, onSearchInput } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!searchMode) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [searchMode]);

  if (!searchMode) {
    return <ActionItem icon="search" onClick={onSearchToggle} />;
  }

  return (
    <div className="explorer-search">
      <div className="explorer-search__input">
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
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            e.preventDefault();
            e.stopPropagation();
            onSearchToggle();
          }}
        />
      </div>
      <div className="explorer-search__clear">
        <ActionItem
          icon="x"
          onClick={onSearchToggle}
          className="cancel-search-btn"
        />
      </div>
    </div>
  );
}
