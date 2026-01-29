import React, { useEffect, useRef } from "react";
import { Platform } from "obsidian";
import { Icon } from "./shared";

export function SearchBar(props: {
  searchMode: boolean;
  searchQuery: string;
  onSearchToggle: () => void;
  onSearchInput: (query: string) => void;
}): JSX.Element {
  const { searchMode, searchQuery, onSearchToggle, onSearchInput } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input when search opens
  useEffect(() => {
    if (!searchMode) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [searchMode]);

  return (
    <div className="pages-nav">
      {searchMode ? (
        <div id="explorer-searchbar" className="search-bar-container">
          <button className="clickable-icon glass-btn" onClick={onSearchToggle}>
            <Icon name="undo-2" />
          </button>
          <div className="explorer-search-bar">
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
        </div>
      ) : null}
    </div>
  );
}
