import React from "react";
import type { Explorer } from "../../explorer/api";
import { ExplorerFileNode } from "../../explorer/model";
import { ExplorerModel } from "../../explorer/model";
import type { ContextMenuConfig } from "../context-menu";
import { fileInteractionProps } from "./interactions";
import { NoteExtensionBadge, Pin } from "./note/note-parts";
import { Gap, Group } from "./primitives/layout";
import { Link } from "./primitives/link";
const showTags = false;

export type MarkdownListViewProps = {
  model: ExplorerModel;
  files: ExplorerFileNode[];
  explorer: Explorer;
  contextMenu: ContextMenuConfig;
};

export function MarkdownListView(
  props: MarkdownListViewProps,
): React.JSX.Element {
  const { files, model, explorer, contextMenu } = props;
  const useBullet = model.settings.listStyle === "markdown";

  return (
    <div
      className="explorer-markdown-list"
      // dir="auto"
    >
      {files.map((file) => (
        <li
          key={file.path}
          className="explorer-markdown-list__item"
          data-list-style={model.settings.listStyle}
          data-pinned={file.isPinned || undefined}
          {...fileInteractionProps<HTMLLIElement>(file, explorer, contextMenu, {
            openOnClick: false,
          })}
          dir="auto"
        >
          {file.isPinned ? (
            <span
              className="explorer-markdown-list__pin"
              data-bullets={useBullet || undefined}
            >
              <Pin
                file={file}
                explorer={explorer}
                onChanged={contextMenu.onChanged}
                placement="inline"
              />
            </span>
          ) : (
            useBullet && <span className="list-bullet" />
          )}

          <Group justify="start">
            <Link
              path={file.path}
              className="explorer-markdown-list__title"
              draggable={false}
              variant="body"
              color="accent"
              underline="hover"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void explorer.openFile(file.file, {
                  newLeaf: event.ctrlKey || event.metaKey,
                });
              }}
            >
              {file.displayName}
            </Link>
            {file.extensionLabel && showTags && (
              <>
                <Gap size={1} />
                <NoteExtensionBadge file={file} />
              </>
            )}
          </Group>
        </li>
      ))}
    </div>
  );
}
