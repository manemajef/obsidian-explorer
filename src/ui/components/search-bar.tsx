import React, { useEffect, useRef, useState } from "react";
import { Platform } from "obsidian";
import { Icon } from "./shared";
import { findScrollParent } from "../../utils/scroll-utils";

export function SearchBar(props: {
  searchMode: boolean;
  searchQuery: string;
  onSearchToggle: () => void;
  onSearchInput: (query: string) => void;
}): JSX.Element {
  const { searchMode, searchQuery, onSearchToggle, onSearchInput } = props;

  const [value, setValue] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!searchMode) return;
    const frame = window.requestAnimationFrame(() => {
      targetRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
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
    <div className="pages-nav">
      {searchMode ? (
        <div
          id="explorer-searchbar"
          ref={targetRef}
          className="search-bar-container"
        >
          <button
            className="clickable-icon glass-btn"
            onClick={(e) => {
              const container = (e.currentTarget as HTMLElement).closest(
                ".explorer-container",
              ) as HTMLElement | null;
              const scroller = container ? findScrollParent(container) : null;
              if (scroller) {
                scroller.scrollTo({ top: 0, behavior: "smooth" });
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
      ) : null}
    </div>
  );
}
