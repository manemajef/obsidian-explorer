import React from "react";
import { App } from "obsidian";
import { FileInfo } from "../../types";
import { InternalLink } from "./shared";
import { Badge } from "./ui/badge";
import { Group } from "./ui/layout";

export function ListView(props: {
  app: App;
  sourcePath: string;
  files: FileInfo[];
}): React.JSX.Element {
  const { app, sourcePath, files } = props;

  return (
    <>
      {files.map((fileInfo) => (
        <li
          key={fileInfo.file.path}
          className={`explorer-list${fileInfo.isPinned ? " pinned" : ""}`}
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
            {fileInfo.file.extension !== "md" && (
              <Badge variant="ext-filled">{fileInfo.file.extension}</Badge>
            )}
            {fileInfo.isPinned && <Badge variant="pin" />}
          </Group>
        </li>
      ))}
    </>
  );
}
