import React, {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { App, Platform, TFolder } from "obsidian";
import { Search } from "./search";
import { cn } from "./primitives/cn";
import { Gap, Group, Spacer } from "./primitives/layout";
import { Icon } from "./primitives/icon";
import { folderDropProps, MoveIntoFolder } from "../drag-drop";

/* Local Toolbar Components */
export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  density?: "compact";
  fit?: "content";
  children: ReactNode;
}

export function Toolbar({
  density,
  fit,
  className,
  children,
  ...rest
}: ToolbarProps): React.JSX.Element {
  return (
    <div
      className={cn("explorer-toolbar", className)}
      data-density={density}
      data-fit={fit}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface ToolbarItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  icon: string;
  active?: boolean;
}

export const ToolbarItem = forwardRef<HTMLButtonElement, ToolbarItemProps>(
  ({ icon, active, className, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn("explorer-toolbar-item", className)}
      data-active={active || undefined}
      data-glass=""
      data-interactive=""
      {...rest}
    >
      <Icon name={icon} />
    </button>
  ),
);
ToolbarItem.displayName = "ToolbarItem";

export interface ToolbarGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ToolbarGroup({
  className,
  children,
  ...rest
}: ToolbarGroupProps): React.JSX.Element {
  return (
    <div
      className={cn("explorer-toolbar-group", className)}
      data-glass=""
      {...rest}
    >
      {children}
    </div>
  );
}

export const ToolbarGroupItem = forwardRef<HTMLButtonElement, ToolbarItemProps>(
  ({ icon, active, className, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn("explorer-toolbar-group-item", className)}
      data-active={active || undefined}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  ),
);
ToolbarGroupItem.displayName = "ToolbarGroupItem";

const SETTINGS_ICON = "settings-2";

export function ActionsBar(props: {
  app: App;
  parentDropFolder: TFolder | null;
  onMoveIntoFolder: MoveIntoFolder;
  onOpenSettings: () => void;
  onSaveFolderNote?: () => void;
  onGoToParent: (newLeaf: boolean) => void;
  onNewFolder: () => void;
  onNewNote: () => void;
  onSearchToggle: () => void;
  searchMode: boolean;
  searchQuery: string;
  onSearchInput: (query: string) => void;
  canGoToParent: boolean;
  compactActionBar: boolean;
}): React.JSX.Element {
  const {
    app,
    parentDropFolder,
    onMoveIntoFolder,
    onOpenSettings,
    onSaveFolderNote,
    onGoToParent,
    onNewFolder,
    onNewNote,
    searchMode,
    searchQuery,
    onSearchToggle,
    onSearchInput,
    canGoToParent,
    compactActionBar,
  } = props;
  const USE_PEN = false;
  const isMobile = Platform.isMobile;
  const toolbarProps = {
    id: "explorer-actions",
    className: cn(
      "explorer-actions",
      compactActionBar && "explorer-actions--compact",
    ),
    density: compactActionBar ? ("compact" as const) : undefined,
    fit: isMobile && !compactActionBar ? ("content" as const) : undefined,
  };

  const leadAction = canGoToParent ? (
    <ToolbarItem
      icon="undo-2"
      className="explorer-parent-action"
      {...folderDropProps<HTMLButtonElement>(
        app,
        parentDropFolder,
        onMoveIntoFolder,
      )}
      onClick={() => onGoToParent(false)}
    />
  ) : (
    <ToolbarItem icon={SETTINGS_ICON} onClick={onOpenSettings} />
  );

  if (isMobile && searchMode) {
    return (
      <Toolbar
        {...toolbarProps}
        className={cn(toolbarProps.className, "explorer-actions--search")}
      >
        <Spacer />
        <Search
          searchMode={searchMode}
          searchQuery={searchQuery}
          onSearchToggle={onSearchToggle}
          onSearchInput={onSearchInput}
        />
        <Spacer />
      </Toolbar>
    );
  }

  if (isMobile && !canGoToParent) {
    return (
      <Toolbar {...toolbarProps}>
        {leadAction}
        <Spacer minWidth=".5em" />
        <ToolbarGroup>
          <ToolbarGroupItem icon="folder-plus" onClick={onNewFolder} />
          <Gap inline size=".5em" />
          <ToolbarGroupItem icon="file-plus" onClick={onNewNote} />
          <Gap inline size=".5em" />
          <ToolbarGroupItem icon="search" onClick={onSearchToggle} />
        </ToolbarGroup>
      </Toolbar>
    );
  }

  if (isMobile) {
    return (
      <Toolbar {...toolbarProps}>
        {leadAction}
        <Spacer minWidth=".8em" />
        <ToolbarGroup>
          <ToolbarGroupItem icon={SETTINGS_ICON} onClick={onOpenSettings} />
          <Gap inline size=".5em" />
          <ToolbarGroupItem icon="folder-plus" onClick={onNewFolder} />
          <Gap inline size=".5em" />
          <ToolbarGroupItem icon="file-plus" onClick={onNewNote} />
          <Gap inline size=".5em" />
          <ToolbarGroupItem icon="search" onClick={onSearchToggle} />
        </ToolbarGroup>
      </Toolbar>
    );
  }

  return (
    <Toolbar {...toolbarProps}>
      <Group gap={2} className="explorer-actions__start">
        {leadAction}
      </Group>

      <Spacer />

      <Group className="explorer-actions__end">
        <ToolbarGroup>
          {canGoToParent && (
            <ToolbarGroupItem icon={SETTINGS_ICON} onClick={onOpenSettings} />
          )}
          <ToolbarGroupItem icon="folder-plus" onClick={onNewFolder} />
          <ToolbarGroupItem icon="file-plus-2" onClick={onNewNote} />
          {onSaveFolderNote && !isMobile && USE_PEN && (
            <ToolbarGroupItem icon="pen-line" onClick={onSaveFolderNote} />
          )}
        </ToolbarGroup>
        <Gap inline size={compactActionBar ? ".25em" : ".6em"} />
        <Search
          searchMode={searchMode}
          searchQuery={searchQuery}
          onSearchToggle={onSearchToggle}
          onSearchInput={onSearchInput}
        />
      </Group>
    </Toolbar>
  );
}
