import React from "react";
import { App, Platform } from "obsidian";
import { FileInfo } from "../../types";
import { InternalLink } from "./shared";
import { Badge } from "./ui/badge";
import { Group } from "./ui/layout";
const FANCY_LIST = false;

export function ListView(props: {
  app: App;
  sourcePath: string;
  files: FileInfo[];
  showTags: boolean;
}): React.JSX.Element {
  const { app, sourcePath, files, showTags } = props;
  const n = files.length;
  if (n == 0) return <div></div>;

  return (
    <div
      className={`explorer-list-container ${FANCY_LIST ? "use-fancy-list" : ""}`}
    >
      {files.map((fileInfo, i) => (
        <div className="list-item-container">
          <li
            key={fileInfo.file.path}
            className={`explorer-list${fileInfo.isPinned ? " pinned" : ""}`}
            onClick={() => {
              if (Platform.isMobile || FANCY_LIST) {
                void app.workspace.openLinkText(fileInfo.file.path, "", false);
              }
            }}
          >
            <span className="list-bullet" />
            <Group justify="between">
              <InternalLink
                app={app}
                sourcePath={sourcePath}
                path={fileInfo.file.path}
                text={
                  fileInfo.file.extension === "md"
                    ? fileInfo.file.basename
                    : `${fileInfo.file.basename}.${fileInfo.file.extension}`
                }
              />
              {showTags && (
                <div className="tags-container flex-scroll">
                  {fileInfo.tags?.map((t) => (
                    <Badge variant="tag">{t}</Badge>
                  ))}
                </div>
              )}
              {fileInfo.file.extension !== "md" && (
                <Badge variant="ext-filled">{fileInfo.file.extension}</Badge>
              )}
              {fileInfo.isPinned && <Badge variant="pin" />}
            </Group>
            {i < n - 1 && (Platform.isMobile || FANCY_LIST) && (
              <div className="list-seperator" />
            )}
          </li>
        </div>
      ))}
    </div>
  );
}
