import React from "react";
import { createRoot, Root } from "react-dom/client";
import { App, MarkdownPostProcessorContext, TFile, TFolder, Notice } from "obsidian";
import { ExplorerSettings, FileInfo } from "../types";
import { isRtl } from "../utils/helpers";
import { getFileInfo, isFolderNote } from "../utils/file-utils";
import { FolderIndex } from "../services/folder-index";
import { serializeSettings } from "../services/settings-parser";

import { ExplorerSettingsModal } from "./modals/settings-modal";
import { PromptModal } from "./modals/prompt-modal";
import { ExplorerUI } from "./explorer-ui";

export class ExplorerView {
	app: App;
	container: HTMLElement;
	settings: ExplorerSettings;
	ctx: MarkdownPostProcessorContext;
	sourcePath: string;

	private folderIndex: FolderIndex | null = null;
	private currentFolder: TFolder | null = null;
	private currentPage = 0;
	private searchQuery = "";
	private searchMode = false;
	private collapsedFolders: Set<string> = new Set();
	private reactRoot: Root | null = null;

	constructor(
		app: App,
		container: HTMLElement,
		settings: ExplorerSettings,
		ctx: MarkdownPostProcessorContext
	) {
		this.app = app;
		this.container = container;
		this.settings = settings;
		this.ctx = ctx;
		this.sourcePath = ctx.sourcePath;
	}

	async render(): Promise<void> {
		this.container.addClass("explorer-container");

		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || !activeFile.parent) {
			this.renderEmpty("No active file or folder");
			return;
		}

		const folder = activeFile.parent;
		this.currentFolder = folder;
		this.container.setAttribute("dir", isRtl() ? "rtl" : "ltr");

		this.folderIndex = new FolderIndex(this.app, folder);
		await this.folderIndex.loadToDepth(this.settings.depth);

		this.renderWithIndex();
	}

	private renderEmpty(message: string): void {
		this.renderReact(<p>{message}</p>);
	}

	private renderReact(node: React.ReactElement): void {
		if (!this.reactRoot) {
			this.reactRoot = createRoot(this.container);
		}
		this.reactRoot.render(node);
	}

	private renderWithIndex(): void {
		if (!this.folderIndex || !this.currentFolder) return;

		const files = this.getRenderedFiles();
		const fileInfos = files.map((f) => getFileInfo(this.app, f));

		// Sort pinned to top
		fileInfos.sort((a, b) => {
			if (a.isPinned && !b.isPinned) return -1;
			if (!a.isPinned && b.isPinned) return 1;
			if (a.isFav && !b.isFav) return -1;
			if (!a.isFav && b.isFav) return 1;
			return 0;
		});

		const usePaging = fileInfos.length > this.settings.pageSize && this.settings.view !== "tree";
		const totalPages = Math.ceil(fileInfos.length / this.settings.pageSize);
		const startIdx = this.currentPage * this.settings.pageSize;
		const pageFiles = usePaging
			? fileInfos.slice(startIdx, startIdx + this.settings.pageSize)
			: fileInfos;

		const extForCard =
			this.settings.cardExt !== "default"
				? this.settings.cardExt
				: this.settings.depth > 0
					? "folder"
					: "ctime";

		const visibleCount = fileInfos.length;

		this.renderReact(
			<ExplorerUI
				app={this.app}
				sourcePath={this.sourcePath}
				folder={this.currentFolder}
				settings={this.settings}
				folderIndex={this.folderIndex}
				folderNotes={this.folderIndex.folderNotes}
				fileInfos={fileInfos}
				pageFiles={pageFiles}
				usePaging={usePaging}
				totalPages={totalPages}
				currentPage={this.currentPage}
				extForCard={extForCard}
				searchMode={this.searchMode}
				searchQuery={this.searchQuery}
				visibleCount={visibleCount}
				collapsedFolders={this.collapsedFolders}
				onOpenSettings={() => this.openSettings()}
				onNewFolder={() => this.promptNewFolder(this.currentFolder?.path || "")}
				onNewNote={() => this.createNewNote(this.currentFolder?.path || "")}
				onSearchToggle={() => {
					this.searchMode = !this.searchMode;
					if (!this.searchMode) {
						this.searchQuery = "";
						this.currentPage = 0;
					}
					this.render();
				}}
				onSearchInput={(query) => {
					this.searchQuery = query;
					this.currentPage = 0;
					this.renderWithIndex();
				}}
				onCollapseToggle={() => {
					this.settings.autoCollapseTree = !this.settings.autoCollapseTree;
					this.updateSourceBlock(this.settings);
					this.render();
				}}
				onPageChange={(page) => {
					this.currentPage = page;
					this.renderWithIndex();
				}}
				onToggleFolder={(folderPath) => {
					if (this.collapsedFolders.has(folderPath)) {
						this.collapsedFolders.delete(folderPath);
					} else {
						this.collapsedFolders.add(folderPath);
					}
					this.renderWithIndex();
				}}
			/>
		);
	}

	private getRenderedFiles(): TFile[] {
		if (!this.folderIndex) return [];

		let files = this.folderIndex.getFilesToDisplay(this.settings);

		if (!this.settings.showFolders) {
			files = [...this.folderIndex.folderNotes, ...files];
		}

		files = this.filterFiles(files);
		files = this.sortFiles(files);

		return files;
	}

	private filterFiles(files: TFile[]): TFile[] {
		if (!this.searchQuery) return files;

		const query = this.searchQuery.toLowerCase();

		if (query.startsWith("#")) {
			const tag = query.slice(1);
			return files.filter((f) => {
				const info = getFileInfo(this.app, f);
				return info.tags?.some((t) => t.toLowerCase().includes(tag));
			});
		}

		if (query.startsWith("@")) {
			const searchTerm = query.slice(1);
			return files.filter((f) => {
				if (!isFolderNote(f)) return false;
				return f.basename.toLowerCase().includes(searchTerm);
			});
		}

		return files.filter(
			(f) => f.name.toLowerCase().includes(query) || f.path.toLowerCase().includes(query)
		);
	}

	private sortFiles(files: TFile[]): TFile[] {
		const sorted = [...files];

		switch (this.settings.sortBy) {
			case "newest":
				sorted.sort((a, b) => b.stat.ctime - a.stat.ctime);
				break;
			case "oldest":
				sorted.sort((a, b) => a.stat.ctime - b.stat.ctime);
				break;
			case "edited":
				sorted.sort((a, b) => b.stat.mtime - a.stat.mtime);
				break;
			case "name":
				sorted.sort((a, b) => a.name.localeCompare(b.name));
				break;
		}

		return sorted;
	}

	private openSettings(): void {
		new ExplorerSettingsModal(this.app, this.settings, async (newSettings) => {
			this.settings = newSettings;
			await this.updateSourceBlock(newSettings);
			await this.render();
		}).open();
	}

	private async updateSourceBlock(settings: ExplorerSettings): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(this.sourcePath);
		if (!(file instanceof TFile)) return;

		const sectionInfo = this.ctx.getSectionInfo(this.container);
		if (!sectionInfo) {
			// Fallback: try regex approach
			const content = await this.app.vault.read(file);
			const newSource = serializeSettings(settings);
			const regex = /```explorer\n[\s\S]*?```/;
			const replacement = newSource ? `\`\`\`explorer\n${newSource}\n\`\`\`` : "```explorer\n```";
			const newContent = content.replace(regex, replacement);
			if (newContent !== content) {
				await this.app.vault.modify(file, newContent);
			}
			return;
		}

		const content = await this.app.vault.read(file);
		const lines = content.split("\n");
		const { lineStart, lineEnd } = sectionInfo;

		const newSource = serializeSettings(settings);
		const newBlock = newSource ? `\`\`\`explorer\n${newSource}\n\`\`\`` : "```explorer\n```";

		const newLines = [...lines.slice(0, lineStart), newBlock, ...lines.slice(lineEnd + 1)];

		const newContent = newLines.join("\n");
		if (newContent !== content) {
			await this.app.vault.modify(file, newContent);
		}
	}

	private async promptNewFolder(basePath: string): Promise<void> {
		const name = await this.promptForName("New Folder", "Enter folder name");
		if (!name) return;

		const folderPath = `${basePath}/${name}`;
		const folderNotePath = `${folderPath}/${name}.md`;

		try {
			await this.app.vault.createFolder(folderPath);
			await this.app.vault.create(folderNotePath, "");
			const file = this.app.vault.getAbstractFileByPath(folderNotePath);
			if (file instanceof TFile) {
				await this.app.workspace.getLeaf().openFile(file);
			}
		} catch (e) {
			new Notice(`Failed to create folder: ${e}`);
		}
	}

	private async createNewNote(basePath: string): Promise<void> {
		const name = await this.promptForName("New Note", "Enter note name");
		if (!name) return;

		const notePath = `${basePath}/${name}.md`;

		try {
			await this.app.vault.create(notePath, "");
			const file = this.app.vault.getAbstractFileByPath(notePath);
			if (file instanceof TFile) {
				await this.app.workspace.getLeaf().openFile(file);
			}
		} catch (e) {
			new Notice(`Failed to create note: ${e}`);
		}
	}

	private promptForName(title: string, placeholder: string): Promise<string | null> {
		return new Promise((resolve) => {
			new PromptModal(this.app, title, placeholder, resolve).open();
		});
	}
}
