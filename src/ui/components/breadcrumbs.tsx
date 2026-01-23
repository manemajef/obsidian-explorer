import React from "react";
import { App, TFolder } from "obsidian";
import { isRtl } from "../../utils/helpers";
import { getFolderNoteForFolder } from "../../utils/file-utils";
import { Icon, InternalLink } from "./shared";

export function Breadcrumbs(props: { app: App; sourcePath: string; folder: TFolder }): JSX.Element {
	const { app, sourcePath, folder } = props;

	const parts: { name: string; path: string }[] = [];
	let current: TFolder | null = folder;

	while (current && current.path !== "/") {
		parts.unshift({ name: current.name, path: current.path });
		current = current.parent;
	}

	return (
		<div className="explorer-breadcrumbs">
			<InternalLink
				app={app}
				sourcePath={sourcePath}
				path="Home.md"
				className="explorer-breadcrumb-home"
			>
				<Icon name="home" />
			</InternalLink>

			{parts.map((part) => {
				const folderObj = app.vault.getAbstractFileByPath(part.path);
				const folderNote = folderObj instanceof TFolder ? getFolderNoteForFolder(app, folderObj) : null;

				return (
					<React.Fragment key={part.path}>
						<span className="explorer-breadcrumb-sep">
							<Icon name={isRtl(part.name) ? "chevron-left" : "chevron-right"} />
						</span>
						{folderNote ? (
							<InternalLink
								app={app}
								sourcePath={sourcePath}
								path={folderNote.path}
								className="explorer-breadcrumb-link"
								text={part.name}
							/>
						) : (
							<span className="explorer-breadcrumb-link">{part.name}</span>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
}
