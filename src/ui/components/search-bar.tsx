import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./shared";
import { Platform } from "obsidian";
import { smoothScrollToTarget } from "../../utils/scroll-utils";

export function SearchBar(props: {
  searchMode: boolean;
  searchQuery: string;
  onSearchToggle: () => void;
  onSearchInput: (query: string) => void;
}): JSX.Element {
  const {
    searchMode,
    searchQuery,
    onSearchToggle,
    onSearchInput,
  } = props;

  const [value, setValue] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollOffsetEm = 2;

  useEffect(() => {
    if (searchMode) {
      // Delay to let React/Obsidian settle after full re-render
      const timer = setTimeout(() => {
        const target = containerRef.current;
        if (target) {
          const fontSize = parseFloat(getComputedStyle(target).fontSize) || 16;
          smoothScrollToTarget(target, fontSize * scrollOffsetEm);
        }
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [searchMode]);

  useEffect(() => {
    setValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!searchMode) return;
    const handle = window.setTimeout(() => {
      onSearchInput(value);
    }, 200);
    return () => window.clearTimeout(handle);
  }, [value, searchMode, onSearchInput]);

  return (
    <div
      className="pages-nav"
      style={{ display: "flex", justifyContent: "space-between" }}
    >
      {searchMode ? (
        <div
          id="explorer-searchbar"
          ref={containerRef}
          className="search-bar-container"
        >
          <button
            className="clickable-icon glass-btn"
            onClick={(e) => {
              const container = (e.currentTarget as HTMLElement).closest(
                ".explorer-container",
              ) as HTMLElement;
              if (container) {
                smoothScrollToTarget(container, 0);
              }
              onSearchToggle();
            }}
          >
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
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>
      ) : (
        null
      )}
    </div>
  );
}
