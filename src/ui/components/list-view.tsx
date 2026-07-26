import React from "react";
import { Platform } from "obsidian";
import type { Explorer } from "../../explorer/api";
import { ExplorerFileNode } from "../../explorer/model";
import { ExplorerModel } from "../../explorer/model";
import type { ContextMenuConfig } from "../context-menu";
import { MarkdownListView } from "./markdown-list-view";
import { ModernListView } from "./modern-list-view";

type ListViewProps = {
  model: ExplorerModel;
  files: ExplorerFileNode[];
  explorer: Explorer;
  contextMenu: ContextMenuConfig;
};

export function ListView(props: ListViewProps): React.JSX.Element {
  const { files } = props;
  if (files.length == 0) return <div></div>;

  const { settings } = props.model;
  const shouldUseModernList =
    settings.listStyle === "modern" ||
    (Platform.isMobile && settings.adaptToMobile);

  if (shouldUseModernList) {
    return <ModernListView {...props} />;
  }

  return <MarkdownListView {...props} />;
}
