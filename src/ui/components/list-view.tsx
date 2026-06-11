import React from "react";
import { Platform } from "obsidian";
import { ExplorerModel } from "../../explorer/model";
import { ExplorerFileNode } from "../../explorer/lib/nodes";
import { ExplorerActions } from "../../explorer/actions";
import type { ContextMenuConfig } from "../context-menu";
import { fileInteractionProps } from "./interactions";
import { Card } from "./ui/card";
import { Link } from "./ui/link";
import { ListRow } from "./ui/list-row";
import { Gap, Group, Spacer, Stack } from "./ui/layout";
import { NoteDatePreview, NoteFolder } from "./note-metadata";
import { NoteExtensionBadge, NoteTags, NoteTitle, Pin } from "./note-parts";

type ListViewProps = {
  model: ExplorerModel;
  files: ExplorerFileNode[];
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
};

export function ListView(props: ListViewProps): React.JSX.Element {
  const { files } = props;
  if (files.length == 0) return <div></div>;
  const { settings, pluginSettings } = props.model;
  const shouldUseModernList =
    settings.listStyle === "modern" ||
    (Platform.isMobile && pluginSettings.alwaysUseModernListInMobile);
  if (shouldUseModernList) {
    return <ModernList {...props} />;
  }
  return <ClassicList {...props} />;
}

function ClassicList(props: ListViewProps): React.JSX.Element {
  const { files, model, actions, contextMenu } = props;
  const useBullet = model.settings.listStyle === "markdown";

  return (
    <div className="explorer-classic-list">
      {files.map((file) => (
        <li
          key={file.path}
          className="explorer-classic-list__item"
          data-list-style={model.settings.listStyle}
          data-pinned={file.isPinned || undefined}
          {...fileInteractionProps<HTMLLIElement>(file, actions, contextMenu, {
            openOnClick: false,
          })}
        >
          {file.isPinned ? (
            <span
              className="explorer-classic-list__pin"
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
              className="explorer-classic-list__title"
              draggable={false}
              role="body"
              emphasis="accent"
              underline="hover"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void actions.openFile(file, event.ctrlKey || event.metaKey);
              }}
            >
              {file.displayName}
            </Link>
            {file.extensionLabel && (
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

function ModernList(props: ListViewProps): React.JSX.Element {
  const { files, model, actions, contextMenu } = props;
  const variant = Platform.isMobile ? "mobile" : "desktop";
  const isMobile = variant === "mobile";

  return (
    <Card
      surface="raised"
      radius="lg"
      className="explorer-modern-list"
      data-variant={variant}
    >
      {files.map((file, i) => (
        <ListRow
          key={file.path}
          shellClassName="explorer-modern-list__shell"
          className="explorer-modern-list__row"
          interactive={isMobile}
          last={i >= files.length - 1}
          data-pinned={file.isPinned || undefined}
          {...fileInteractionProps(file, actions, contextMenu)}
        >
          <Stack
            className="explorer-modern-list__content"
            gap={isMobile ? 1 : 0}
          >
            <Group className="explorer-modern-list__primary" gap={2}>
              <div className="explorer-modern-list__title-slot">
                <Pin
                  file={file}
                  actions={actions}
                  className="explorer-modern-list__pin"
                  placement="row-leading"
                  reserveSpace={false}
                />
                <NoteTitle
                  file={file}
                  actions={actions}
                  className="explorer-modern-list__title"
                  weight={isMobile ? "bold" : "medium"}
                />
              </div>

              <Spacer />

              <NoteExtensionBadge
                file={file}
                className="explorer-modern-list__extension"
              />
            </Group>

            <Group className="explorer-modern-list__secondary" gap={2}>
              <div className="explorer-modern-list__metadata">
                {!isMobile && (
                  <NoteFolder file={file} model={model} actions={actions} />
                )}
                <NoteDatePreview
                  file={file}
                  model={model}
                  maxChar={isMobile ? 120 : 90}
                  showPreview={model.settings.showPreviews}
                />
              </div>

              <Gap size={4} />
              {!isMobile && (
                <NoteTags
                  file={file}
                  model={model}
                  className="explorer-modern-list__tags"
                  overflow="hidden"
                  size="sm"
                />
              )}
            </Group>
          </Stack>
        </ListRow>
      ))}
    </Card>
  );
}
