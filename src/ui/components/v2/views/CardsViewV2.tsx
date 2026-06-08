import React from "react";
import { ExplorerActions } from "../../../../explorer/actions";
import { ExplorerFileNode } from "../../../../explorer/lib/nodes";
import { ExplorerModel } from "../../../../explorer/model";
import type { ContextMenuConfig } from "../../../context-menu";
import { cn } from "../utils/cn";
import { FileCardContent, FileSurface } from "../patterns";

type CardsViewV2Props = {
  model: ExplorerModel;
  files: ExplorerFileNode[];
  actions: ExplorerActions;
  contextMenu: ContextMenuConfig;
};

export function CardsViewV2({
  model,
  files,
  actions,
  contextMenu,
}: CardsViewV2Props): React.JSX.Element {
  return (
    <div className="ex-cards-view">
      <div
        className={cn(
          "ex-cards-grid",
          model.settings.compactCards && "ex-cards-grid--compact",
        )}
      >
        {files.map((file) => (
          <FileSurface
            key={file.path}
            file={file}
            model={model}
            actions={actions}
            contextMenu={contextMenu}
            surfaceVariant="card"
          >
            <FileCardContent file={file} model={model} actions={actions} />
          </FileSurface>
        ))}
      </div>
    </div>
  );
}
