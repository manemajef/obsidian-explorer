import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./shared";

export function SearchBar(props: {
	searchMode: boolean;
	searchQuery: string;
	allowSearch: boolean;
	isTreeView: boolean;
	childrenSize: number;
	autoCollapseTree: boolean;
	onSearchToggle: () => void;
	onSearchInput: (query: string) => void;
	onCollapseToggle: () => void;
}): JSX.Element {
	const {
		searchMode,
		searchQuery,
		allowSearch,
		isTreeView,
		childrenSize,
		autoCollapseTree,
		onSearchToggle,
		onSearchInput,
		onCollapseToggle,
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
		<div className="pages-nav" style={{ display: "flex", justifyContent: "space-between" }}>
			{searchMode ? (
				<div className="search-bar-container">
					<button className="clickable-icon" onClick={onSearchToggle}>
						<Icon name="undo-2" />
						<span style={{ width: ".25em" }}> exit</span>
					</button>
					<div className="explorer-search-bar">
						<input
							ref={inputRef}
							type="text"
							placeholder="Search..."
							value={value}
							onChange={(e) => setValue(e.target.value)}
						/>
					</div>
				</div>
			) : (
				<>
					{allowSearch && !isTreeView && childrenSize > 12 ? (
						<button className="clickable-icon" onClick={onSearchToggle}>
							<Icon name="search" />
							<span style={{ marginInlineStart: ".5em" }}> Search</span>
						</button>
					) : null}
					{isTreeView ? (
						<button className="clickable-icon" onClick={onCollapseToggle}>
							<Icon name={autoCollapseTree ? "chevrons-down-up" : "chevrons-up-down"} />
						</button>
					) : null}
				</>
			)}
		</div>
	);
}
