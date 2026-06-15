import React from "react";
import { ExplorerActions } from "../../explorer/actions";
import { ExplorerFileNode } from "../../explorer/lib/nodes";
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
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
};

export function MarkdownListView(
  props: MarkdownListViewProps,
): React.JSX.Element {
  const { files, model, actions, contextMenu } = props;
  const useBullet = model.settings.listStyle === "markdown";

  return (
    <div className="explorer-markdown-list">
      {files.map((file) => (
        <li
          key={file.path}
          className="explorer-markdown-list__item"
          data-list-style={model.settings.listStyle}
          data-pinned={file.isPinned || undefined}
          {...fileInteractionProps<HTMLLIElement>(file, actions, contextMenu, {
            openOnClick: false,
          })}
        >
          {file.isPinned ? (
            <span
              className="explorer-markdown-list__pin"
              data-bullets={useBullet || undefined}
            >
              <Pin file={file} actions={actions} placement="inline" />
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
                void actions.openFile(file, event.ctrlKey || event.metaKey);
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
