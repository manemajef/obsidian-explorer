import React from "react";
import { Platform } from "obsidian";
import { FileInfo } from "../../types";
import { ExplorerModel } from "../../explorer/model";
import { InternalLink } from "./shared";
import { Badge } from "./ui/badge";
import { Group } from "./ui/layout";
import { Pin } from "./ui/pin";

type ListViewProps = {
  model: ExplorerModel;
  files: FileInfo[];
};

export function ListView(props: ListViewProps): React.JSX.Element {
  const { files } = props;
  const n = files.length;
  if (n == 0) return <div></div>;

  if (Platform.isMobile) {
    return <MobileListView {...props} />;
  }

  const { settings } = props.model;

  return (
    <div className="explorer-list-container">
      {files.map((fileInfo, i) => (
        <div key={fileInfo.file.path} className="list-item-container">
          <li
            className={`explorer-list${fileInfo.isPinned ? " pinned" : ""}`}
            style={{
              marginInlineStart: settings.showListBullets
                ? "var(--explorer-space-4)"
                : "none",
            }}
          >
            {settings.showListBullets && <span className="list-bullet" />}
            <Group justify="between">
              <InternalLink
                path={fileInfo.file.path}
                text={
                  fileInfo.file.extension === "md"
                    ? fileInfo.file.basename
                    : `${fileInfo.file.basename}.${fileInfo.file.extension}`
                }
              />

              <div className="explorer-list-tags">
                {settings.showTags &&
                  fileInfo.tags?.map((t) => (
                    <Badge key={t} variant="tag">
                      {t}
                    </Badge>
                  ))}
                {<Pin fileInfo={fileInfo} />}
              </div>

              {fileInfo.file.extension !== "md" && (
                <Badge variant="ext-filled">{fileInfo.file.extension}</Badge>
              )}
            </Group>
          </li>
        </div>
      ))}
    </div>
  );
}

const MobileListView = (props: ListViewProps): React.JSX.Element => {
  const { model, files } = props;
  const { settings } = model;

  return (
    <div className="explorer-mobile-list ">
      {files.map((fileInfo, i) => (
        <div key={fileInfo.file.path} className="explorer-mobile-list-item">
          <InternalLink
            path={fileInfo.file.path}
            className={`explorer-mobile-note${fileInfo.isPinned ? " pinned" : ""} ${i >= files.length - 1 ? "explorer-mobile-note-last" : ""}`}
          >
            <div className="explorer-mobile-note__header">
              <span className="explorer-mobile-note__title">
                {fileInfo.file.extension === "md"
                  ? fileInfo.file.basename
                  : `${fileInfo.file.basename}.${fileInfo.file.extension}`}
              </span>

              {fileInfo.file.extension !== "md" && (
                <Badge
                  variant="ext-filled"
                  className="explorer-mobile-note__ext"
                >
                  {fileInfo.file.extension}
                </Badge>
              )}
            </div>

            <div className="explorer-mobile-note__footer">
              <div className="explorer-mobile-note__tags">
                {settings.showTags &&
                  fileInfo.tags?.map((t) => (
                    <Badge key={t} variant="tag">
                      {t}
                    </Badge>
                  ))}
              </div>
              <Pin fileInfo={fileInfo} />
            </div>
          </InternalLink>

          {i < files.length - 1 && (
            <div className="explorer-mobile-note__divider" />
          )}
        </div>
      ))}
    </div>
  );
};
