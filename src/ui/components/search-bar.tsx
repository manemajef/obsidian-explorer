import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./shared";
import { App, Platform } from "obsidian";

export function SearchBar(props: {
  searchMode: boolean;
  searchQuery: string;
  allowSearch: boolean;
  childrenSize: number;
  onSearchToggle: () => void;
  app: App;
  onSearchInput: (query: string) => void;
}): JSX.Element {
  const {
    searchMode,
    searchQuery,
    allowSearch,
    childrenSize,
    onSearchToggle,
    onSearchInput,
    app,
  } = props;

  const [value, setValue] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (searchMode) {
      // Delay to let React/Obsidian settle after full re-render
      const timer = setTimeout(() => {
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
          className="search-bar-container"
          style={{ scrollMarginTop: "8em" }}
        >
          <button
            className="clickable-icon glass-btn"
            onClick={(e) => {
              const container = (e.currentTarget as HTMLElement).closest(".explorer-container") as HTMLElement;
              container?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        <>
          {false && allowSearch && childrenSize > 12 ? (
            <div>
              <button className="clickable-icon" onClick={onSearchToggle}>
                <Icon name="search" />
                <span style={{ marginInlineStart: ".5em" }}> Search</span>
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
