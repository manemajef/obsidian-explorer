import React from "react";
import { Platform } from "obsidian";
import { ExplorerModel } from "../../explorer/model";
import { ExplorerFileNode } from "../../explorer/lib/nodes";
import { ExplorerActions } from "../../explorer/actions";
import { InternalLink } from "./shared";
import { Badge } from "./ui/badge";
import { Gap, Group, Spacer, Stack } from "./ui/layout";
import { Pin } from "./ui/pin";
import Bar from "./ui/bar";
import { draggableProps, folderDropProps } from "../drag-drop";
import {
  isInteractiveTouchTarget,
  showFileContextMenu,
  type ContextMenuConfig,
} from "../context-menu";
import { TagList } from "./ui/tags";
import { NoteDatePreview, NoteFolder } from "./ui/note-metadata";
import { NoteExtensionBadge, NoteTags, NoteTitle } from "./note-parts";
type ListViewProps = {
  model: ExplorerModel;
  files: ExplorerFileNode[];
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
};

export function ListView(props: ListViewProps): React.JSX.Element {
  const { files } = props;
  const n = files.length;
  if (n == 0) return <div></div>;
  const { settings, pluginSettings } = props.model;
  const shouldUseModernList =
    settings.listStyle === "modern" ||
    (Platform.isMobile && pluginSettings.alwaysUseModernListInMobile);
  if (shouldUseModernList) {
    return <ModernListView {...props} />;
  }
  const useBullet = settings.listStyle === "markdown";

  return (
    <div className="explorer-list-container">
      {files.map((file) => (
        <div key={file.path} className="list-item-container">
          <li
            className={`explorer-list${file.isPinned ? " pinned" : ""}`}
            data-list-style={settings.listStyle}
            data-pinned={file.isPinned || undefined}
            {...draggableProps(file.dragSource, file.dragFromFolderNote)}
            {...folderDropProps(
              props.actions.app,
              file.dropTargetFolder,
              (sourcePath, folder, fromFolderNote) =>
                props.actions.movePathIntoFolder(
                  sourcePath,
                  folder,
                  fromFolderNote,
                ),
            )}
            onContextMenuCapture={(event) =>
              showFileContextMenu(event, props.contextMenu, file)
            }
          >
            {file.isPinned ? (
              <span
                className={`explorer-list-pin${useBullet ? " with-bullets" : ""}`}
              >
                <Pin file={file} actions={props.actions} placement="inline" />
              </span>
            ) : (
              useBullet && <span className="list-bullet" />
            )}

            <Group justify="start">
              <InternalLink
                path={file.path}
                className="explorer-list-note-title"
                draggable={false}
                text={file.displayName}
                variant={useBullet ? "default" : "note-title"}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void props.actions.openFile(
                    file,
                    event.ctrlKey || event.metaKey,
                  );
                }}
              />
              {settings.showTags && file.tags.length > 0 && (
                <>
                  <span className="list-tags-separator" />
                  <TagList
                    tags={file.tags}
                    className="explorer-list-tags"
                    overflow="hidden"
                    size="md"
                  />
                </>
              )}

              {file.extensionLabel && (
                <>
                  <Bar.Spring />
                  {file.isFolderNote ? (
                    <Badge
                      variant="ext-filled"
                      className="explorer-folder-type-badge"
                    >
                      folder
                    </Badge>
                  ) : (
                    <Badge variant="ext-filled">{file.extensionLabel}</Badge>
                  )}
                </>
              )}
            </Group>
          </li>
        </div>
      ))}
    </div>
  );
}

const ModernListView = (props: ListViewProps): React.JSX.Element => {
  const { files } = props;
  const layout = Platform.isMobile ? "mobile" : "desktop";

  return (
    <div className="explorer-modern-list" data-layout={layout}>
      {files.map((file, i) => (
        <React.Fragment key={file.path}>
          <div className="explorer-note-row-shell">
            <div
              className="explorer-note-row"
              data-layout={layout}
              data-pinned={file.isPinned || undefined}
              data-last={i >= files.length - 1 || undefined}
              {...draggableProps(file.dragSource, file.dragFromFolderNote)}
              {...folderDropProps(
                props.actions.app,
                file.dropTargetFolder,
                (sourcePath, folder, fromFolderNote) =>
                  props.actions.movePathIntoFolder(
                    sourcePath,
                    folder,
                    fromFolderNote,
                  ),
              )}
              onContextMenuCapture={(event) =>
                showFileContextMenu(event, props.contextMenu, file)
              }
              onClick={(event) => {
                if (isInteractiveTouchTarget(event.target)) return;
                void props.actions.openFile(
                  file,
                  event.ctrlKey || event.metaKey,
                );
              }}
            >
              <Stack className="explorer-note-row__content" gap={0}>
                <Group className="explorer-note-row__primary" gap={2}>
                  <div className="explorer-note-row__title-slot">
                    <Pin
                      file={file}
                      actions={props.actions}
                      className="explorer-note-row__pin"
                      placement="row-leading"
                      reserveSpace={false}
                    />
                    <NoteTitle
                      file={file}
                      actions={props.actions}
                      className="explorer-note-row__title"
                      weight={Platform.isMobile ? "bold" : "medium"}
                    />
                  </div>

                  <Spacer />

                  <NoteExtensionBadge
                    file={file}
                    className="explorer-note-row__extension"
                  />
                </Group>

                <Group className="explorer-note-row__secondary" gap={2}>
                  <div className="explorer-note-row__metadata">
                    {layout === "desktop" && (
                      <NoteFolder
                        file={file}
                        model={props.model}
                        actions={props.actions}
                      />
                    )}
                    <NoteDatePreview
                      file={file}
                      model={props.model}
                      maxChar={layout === "mobile" ? 120 : 90}
                    />
                  </div>

                  <Gap size={4} />
                  {layout === "desktop" && (
                    <NoteTags
                      file={file}
                      model={props.model}
                      className="explorer-note-row__tags"
                      overflow="hidden"
                      size="sm"
                    />
                  )}
                </Group>
              </Stack>
            </div>
          </div>
          {i < files.length - 1 && (
            <div className="explorer-note-row__divider" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
