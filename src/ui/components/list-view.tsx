import React from "react";
import { Platform } from "obsidian";
import { FileInfo } from "../../types";
import { ExplorerModel } from "../../explorer/model";
import { InternalLink } from "./shared";
import { Badge } from "./ui/badge";
import { Group } from "./ui/layout";
import { Pin } from "./ui/pin";
import Bar from "./ui/bar";

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
              marginInlineStart:
                settings.showListBullets && !fileInfo.isPinned
                  ? "var(--explorer-space-4)"
                  : "none",
              display: fileInfo.isPinned ? "flex" : "block",
            }}
          >
            {fileInfo.isPinned ? (
              <span
                style={{
                  marginInlineStart: settings.showListBullets
                    ? "-.5em"
                    : "-.2em",
                  marginTop: ".2em",
                  // transform: "scale(0.9)",
                }}
              >
                <Pin fileInfo={fileInfo} />
              </span>
            ) : (
              settings.showListBullets && <span className="list-bullet" />
            )}
            {/* {settings.showListBullets &&
              (fileInfo.isPinned ? (
                <span style={{ marginInlineStart: "-.5em" }}>
                  <Pin fileInfo={fileInfo} />
                </span>
              ) : (
                <span className="list-bullet" />
              ))} */}

            <Group justify="start">
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
              </div>
              {fileInfo.file.extension !== "md" && (
                <>
                  <Bar.Spring />
                  <Badge variant="ext-filled">{fileInfo.file.extension}</Badge>
                </>
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
              <Group>
                <Pin fileInfo={fileInfo} />
                <span className="explorer-mobile-note__title">
                  {fileInfo.file.extension === "md"
                    ? fileInfo.file.basename
                    : `${fileInfo.file.basename}.${fileInfo.file.extension}`}
                </span>
              </Group>

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
              {/* <Pin fileInfo={fileInfo} /> */}
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
