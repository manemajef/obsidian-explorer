import { setIcon } from "obsidian";

interface SearchBarOptions {
	searchMode: boolean;
	searchQuery: string;
	allowSearch: boolean;
	isTreeView: boolean;
	childrenSize: number;
	autoCollapseTree: boolean;
	onSearchToggle: () => void;
	onSearchInput: (query: string) => void;
	onCollapseToggle: () => void;
}

export function renderSearchBar(container: HTMLElement, options: SearchBarOptions): void {
	const actionsDiv = container.createDiv({
		cls: "pages-nav",
		attr: { style: "display: flex; justify-content: space-between;" },
	});

	if (options.searchMode) {
		// Search mode: show exit button and search bar
		const searchContainer = actionsDiv.createDiv({ cls: "search-bar-container" });

		// Exit search button
		const exitBtn = searchContainer.createDiv();
		const exitLink = exitBtn.createEl("span", { cls: "clickable-icon" });
		setIcon(exitLink, "undo-2");
		exitLink.createSpan({ text: " exit", attr: { style: "width: 1em" } });
		exitLink.addEventListener("click", options.onSearchToggle);

		// Search input
		const searchBarDiv = searchContainer.createDiv({ cls: "explorer-search-bar" });
		const input = searchBarDiv.createEl("input", {
			attr: {
				type: "text",
				placeholder: "Search...",
				value: options.searchQuery,
			},
		});

		input.focus();

		let debounceTimer: ReturnType<typeof setTimeout>;
		input.addEventListener("input", () => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				options.onSearchInput(input.value);
			}, 200);
		});
	} else {
		// Normal mode: show search button if allowed and has enough items
		if (options.allowSearch && !options.isTreeView && options.childrenSize > 12) {
			const searchBtn = actionsDiv.createEl("button", { cls: "clickable-icon" });
			setIcon(searchBtn, "search");
			searchBtn.createSpan({ text: " Search", attr: { style: "margin-inline-start: .5em" } });
			searchBtn.addEventListener("click", options.onSearchToggle);
		}

		// Tree mode: show collapse/expand button
		if (options.isTreeView) {
			const collapseBtn = actionsDiv.createEl("button", { cls: "clickable-icon" });
			setIcon(collapseBtn, options.autoCollapseTree ? "chevrons-down-up" : "chevrons-up-down");
			collapseBtn.addEventListener("click", options.onCollapseToggle);
		}
	}
}
