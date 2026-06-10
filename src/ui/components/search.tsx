import React, { useEffect, useRef } from "react";
import { Platform } from "obsidian";
import { Button } from "./ui/button";

export type BarMode = {
  compact: boolean;
  mobile: boolean;
};

export function Search(props: {
  searchMode: boolean;
  searchQuery: string;
  onSearchToggle: () => void;
  onSearchInput: (query: string) => void;
  mode: BarMode;
}): React.JSX.Element {
  const { searchMode, searchQuery, onSearchToggle, onSearchInput, mode } =
    props;

  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!searchMode) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [searchMode]);

  if (!searchMode) {
    return (
      <Button
        icon="search"
        variant={mode.compact ? "ghost" : "glass"}
        shape={mode.compact ? "round" : "circle"}
        density={mode.compact ? "compact" : undefined}
        fit={mode.mobile && !mode.compact ? "content" : undefined}
        onClick={onSearchToggle}
      />
    );
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
        <Button
          icon="x"
          className="explorer-search__cancel"
          variant={mode.compact ? "ghost" : "glass"}
          shape={mode.compact ? "round" : "circle"}
          density={mode.compact ? "compact" : undefined}
          fit={mode.mobile && !mode.compact ? "content" : undefined}
          onClick={onSearchToggle}
        />
      </div>
    </div>
  );
}
