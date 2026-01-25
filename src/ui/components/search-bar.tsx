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
    setValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (searchMode) {
      inputRef.current?.focus();
    }
  }, [searchMode]);

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
        <div className="search-bar-container">
          {/* <button className="clickable-icon" onClick={onSearchToggle}> */}
          {/*   <span */}
          {/*     style={{ display: "flex", gap: ".5em", alignItems: "center" }} */}
          {/*     // className="glass" */}
          {/*   > */}
          {/*     <Icon name="undo-2" /> */}
          {/*     <span style={{}}> exit</span> */}
          {/*   </span> */}
          {/* </button> */}
          <div className="explorer-search-bar" style={{ position: "relative" }}>
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
            <button
              style={{ position: "absolute", insetInlineStart: "-1em" }}
              className="clickable-icon glass-btn"
              onClick={onSearchToggle}
            >
              <Icon name="undo-2" />
            </button>
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
