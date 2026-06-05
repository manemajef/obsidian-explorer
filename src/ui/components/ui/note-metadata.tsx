import React from "react";
import { ExplorerFileNode } from "src/explorer/lib/nodes";
import { ExplorerModel } from "src/explorer/model";
import { ExplorerActions } from "src/explorer/actions";
import { resolveCardFooterMode } from "src/explorer/lib/listing";
import { diffDays } from "src/utils";
import { Icon } from "../shared";
import { TagList } from "./tags";
import { Preview } from "./preview";

export function MetaTime({
  file,
  model,
  className,
}: {
  file: ExplorerFileNode;
  model: ExplorerModel;
  className?: string;
}) {
  const { settings, pluginSettings } = model;
  const extForCard = resolveCardFooterMode(settings);

  if (extForCard === "none") return null;

  const parentFolder = file.parentExplorerFolder;
  const showFolder = parentFolder && parentFolder !== model.folder;

  const showTime = extForCard !== "none";
  const isCtime = extForCard === "ctime";
  const dateVal = isCtime ? file.createdAt : file.modifiedAt;
  const timeStr = diffDays(dateVal);
  return (
    <div className={`explorer-metadata-folder-time-row ${className ?? ""}`}>
      {showFolder && showTime && (
        <span className="explorer-metadata-separator" aria-hidden="true" />
      )}
      {showTime && <span className="explorer-metadata-date">{timeStr}</span>}
    </div>
  );
}

export function FolderTimeRow({
  file,
  model,
  actions,
  className,
}: {
  file: ExplorerFileNode;
  model: ExplorerModel;
  actions: ExplorerActions;
  className?: string;
}) {
  const { settings, pluginSettings } = model;
  const extForCard = resolveCardFooterMode(settings);

  if (extForCard === "none") return null;

  const parentFolder = file.parentExplorerFolder;
  const showFolder = parentFolder && parentFolder !== model.folder;

  const showTime = extForCard !== "none";
  const isCtime = extForCard === "ctime";
  const dateVal = isCtime ? file.createdAt : file.modifiedAt;
  const timeStr = diffDays(dateVal);

  return (
    <div className={`explorer-metadata-folder-time-row ${className ?? ""}`}>
      {showFolder && (
        <span
          className="explorer-metadata-folder-link"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void actions.openFolder(parentFolder, e.ctrlKey || e.metaKey);
          }}
        >
          {pluginSettings.ShowIconsInCards && (
            <Icon
              name="folder-closed"
              className="explorer-metadata-folder-icon"
            />
          )}
          <span className="explorer-metadata-folder-name">
            {parentFolder.name}
          </span>
        </span>
      )}
      {showFolder && showTime && (
        <span className="explorer-metadata-separator" aria-hidden="true" />
      )}
      {showTime && <span className="explorer-metadata-date">{timeStr}</span>}
    </div>
  );
}

export function NoteTags({
  file,
  model,
  className,
}: {
  file: ExplorerFileNode;
  model: ExplorerModel;
  className?: string;
}) {
  const { settings } = model;
  if (!settings.showTags || !file.tags || file.tags.length === 0) return null;

  return (
    <div className={`explorer-metadata-tags-row ${className ?? ""}`}>
      <TagList tags={file.tags} className="explorer-metadata-tags" />
    </div>
  );
}

export function NotePreview({
  file,
  className,
  maxChar,
}: {
  file: ExplorerFileNode;
  className?: string;
  maxChar?: number;
}) {
  return (
    <div className={`explorer-metadata-preview-row ${className ?? ""}`}>
      <Preview
        file={file}
        maxChar={maxChar}
        className="explorer-metadata-preview"
      />
    </div>
  );
}

export function NoteMetadata({
  file,
  model,
  actions,
}: {
  file: ExplorerFileNode;
  model: ExplorerModel;
  actions: ExplorerActions;
}) {
  return <FolderTimeRow file={file} model={model} actions={actions} />;
}
