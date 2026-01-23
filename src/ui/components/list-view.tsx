import React from "react";
import { App } from "obsidian";
import { FileInfo } from "../../types";
import { InternalLink } from "./shared";

export function ListView(props: {
  app: App;
  sourcePath: string;
  files: FileInfo[];
}): JSX.Element {
  const { app, sourcePath, files } = props;

  return (
    <>
      {files.map((fileInfo) => (
        <li
          key={fileInfo.file.path}
          className={`explorer-list ${fileInfo.isPinned || fileInfo.isFav ? "pinned" : ""}`}
        >
          <span className="list-bullet" />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
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
            {fileInfo.file.extension !== "md" ? (
              <span className="ext-tag ext-tag-bg">
                {fileInfo.file.extension}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </>
  );
}
