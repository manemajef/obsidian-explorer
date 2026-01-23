import React, { useMemo } from "react";
import { App, TFolder } from "obsidian";
import { ExplorerSettings, FileInfo, FolderInfo } from "../../types";
import { isRtl } from "../../utils/helpers";
import { getFolderNoteForFolder } from "../../utils/file-utils";
import { FolderIndex } from "../../services/folder-index";
import { Icon, InternalLink } from "./shared";

export function TreeView(props: {
	app: App;
	sourcePath: string;
	files: FileInfo[];
	folderIndex: FolderIndex;
	settings: ExplorerSettings;
	collapsedFolders: Set<string>;
	onToggleFolder: (folderPath: string) => void;
}): JSX.Element {
	const { app, sourcePath, files, folderIndex, settings, collapsedFolders, onToggleFolder } = props;

	const filesByFolder = useMemo(() => {
		const map = new Map<string, FileInfo[]>();

		const rootFiles = files.filter((f) => f.file.parent === folderIndex.folder);
		if (rootFiles.length > 0) {
			map.set("", rootFiles);
		}

		for (const fileInfo of files) {
			if (fileInfo.file.parent !== folderIndex.folder) {
				const folderPath = fileInfo.file.parent?.path || "";
				const relativePath = folderPath.replace(folderIndex.folder.path + "/", "");

				if (!map.has(relativePath)) {
					map.set(relativePath, []);
				}
				map.get(relativePath)?.push(fileInfo);
			}
		}

		return map;
	}, [files, folderIndex.folder]);

	const rootFiles = filesByFolder.get("") ?? [];

	return (
		<ul className="explorer-ul">
			{rootFiles.map((fileInfo) => (
				<TreeItem key={fileInfo.file.path} app={app} sourcePath={sourcePath} fileInfo={fileInfo} />
			))}
			{folderIndex.folders.map((folderInfo) => (
				<TreeFolder
					key={folderInfo.folder.path}
					folderInfo={folderInfo}
					filesByFolder={filesByFolder}
					parentPath=""
					settings={settings}
					collapsedFolders={collapsedFolders}
					app={app}
					sourcePath={sourcePath}
					onToggleFolder={onToggleFolder}
				/>
			))}
		</ul>
	);
}

function TreeFolder(props: {
	folderInfo: FolderInfo;
	filesByFolder: Map<string, FileInfo[]>;
	parentPath: string;
	settings: ExplorerSettings;
	collapsedFolders: Set<string>;
	app: App;
	sourcePath: string;
	onToggleFolder: (folderPath: string) => void;
}): JSX.Element {
	const {
		folderInfo,
		filesByFolder,
		parentPath,
		settings,
		collapsedFolders,
		app,
		sourcePath,
		onToggleFolder,
	} = props;

	const folderPath = parentPath
		? `${parentPath}/${folderInfo.folder.name}`
		: folderInfo.folder.name;

	const isCollapsed = settings.autoCollapseTree
		? !collapsedFolders.has(folderPath)
		: collapsedFolders.has(folderPath);

	const folderFiles = filesByFolder.get(folderPath) ?? [];

	return (
		<li className={`explorer-nested-li ${isCollapsed ? "explorer-li-collapsed" : ""}`}>
			<div
				className="explorer-li-item"
				onClick={(e) => {
					if ((e.target as HTMLElement).closest("a")) return;
					onToggleFolder(folderPath);
				}}
			>
				<div className="explorer-li-icons">
					<span className="explorer-li-collapse">
						<Icon
							name={
								isRtl()
									? isCollapsed
										? "chevron-left"
										: "chevron-down"
									: isCollapsed
										? "chevron-right"
										: "chevron-down"
							}
							className={
								isCollapsed ? "explorer-li-collapse-icon-close" : "explorer-li-collapse-icon-open"
							}
						/>
					</span>
					<span className="explorer-li-bullet" />
				</div>
				{folderInfo.folderNote ? (
					<InternalLink
						app={app}
						sourcePath={sourcePath}
						path={folderInfo.folderNote.path}
						text={folderInfo.folder.name}
						className="tree-folder-link"
					/>
				) : (
					<span className="tree-folder-name">{folderInfo.folder.name}</span>
				)}
			</div>

			<ul className={`explorer-ul ${isCollapsed ? "is-collapsed" : ""}`}>
				{folderFiles.map((fileInfo) => (
					<TreeItem key={fileInfo.file.path} app={app} sourcePath={sourcePath} fileInfo={fileInfo} />
				))}
				{folderInfo.folder.children
					.filter((child): child is TFolder => child instanceof TFolder)
					.map((child) => (
						<TreeFolder
							key={child.path}
							folderInfo={{ folder: child, folderNote: getFolderNoteForFolder(app, child) }}
							filesByFolder={filesByFolder}
							parentPath={folderPath}
							settings={settings}
							collapsedFolders={collapsedFolders}
							app={app}
							sourcePath={sourcePath}
							onToggleFolder={onToggleFolder}
						/>
					))}
			</ul>
		</li>
	);
}

function TreeItem(props: { app: App; sourcePath: string; fileInfo: FileInfo }): JSX.Element {
	const { app, sourcePath, fileInfo } = props;

	return (
		<li className="explorer-li">
			<div className="explorer-li-item">
				<div className="explorer-li-icons">
					<span className="explorer-li-bullet" />
				</div>
				<InternalLink
					app={app}
					sourcePath={sourcePath}
					path={fileInfo.file.path}
					text={fileInfo.file.basename}
					className={fileInfo.isPinned || fileInfo.isFav ? "is-pinned" : undefined}
				/>
				{fileInfo.file.extension !== "md" ? (
					<span className="ext-tag"> .{fileInfo.file.extension}</span>
				) : null}
			</div>
		</li>
	);
}
