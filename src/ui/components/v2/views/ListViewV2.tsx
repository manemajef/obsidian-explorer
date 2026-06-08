import React from "react";
import { Platform } from "obsidian";
import { ExplorerActions } from "../../../../explorer/actions";
import { ExplorerFileNode } from "../../../../explorer/lib/nodes";
import { ExplorerModel } from "../../../../explorer/model";
import type { ContextMenuConfig } from "../../../context-menu";
import { Stack } from "../layout";
import {
  FileMarkdownListItemContent,
  FileModernListItemContent,
  FileSurface,
} from "../patterns";
import { Surface } from "../primitives";

type ListViewV2Props = {
  model: ExplorerModel;
  files: ExplorerFileNode[];
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
};

export function ListViewV2(props: ListViewV2Props): React.JSX.Element {
  const { files, model } = props;
  if (files.length === 0) return <div />;

  const shouldUseModernList =
    model.settings.listStyle === "modern" ||
    (Platform.isMobile && model.pluginSettings.alwaysUseModernListInMobile);

  if (shouldUseModernList) return <ModernListViewV2 {...props} />;
  return <MarkdownListViewV2 {...props} />;
}

export function ModernListViewV2({
  model,
  files,
  actions,
  contextMenu,
}: ListViewV2Props): React.JSX.Element {
  return (
    <Surface variant="container" className="ex-modern-list">
      <Stack gap="none">
        {files.map((file, index) => (
          <FileSurface
            key={file.path}
            file={file}
            model={model}
            actions={actions}
            contextMenu={contextMenu}
            surfaceVariant="item"
          >
            <div
              className="ex-modern-list-item"
              data-layout={Platform.isMobile ? "mobile" : "desktop"}
              data-last={index >= files.length - 1 || undefined}
              data-pinned={file.isPinned || undefined}
            >
              <FileModernListItemContent
                file={file}
                model={model}
                actions={actions}
              />
            </div>
          </FileSurface>
        ))}
      </Stack>
    </Surface>
  );
}

export function MarkdownListViewV2({
  model,
  files,
  actions,
  contextMenu,
}: ListViewV2Props): React.JSX.Element {
  return (
    <Stack gap="xs" className="ex-markdown-list">
      {files.map((file) => (
        <FileSurface
          key={file.path}
          file={file}
          model={model}
          actions={actions}
          contextMenu={contextMenu}
          surfaceVariant="plain"
        >
          <div data-pinned={file.isPinned || undefined}>
            <FileMarkdownListItemContent
              file={file}
              model={model}
              actions={actions}
            />
          </div>
        </FileSurface>
      ))}
    </Stack>
  );
}
