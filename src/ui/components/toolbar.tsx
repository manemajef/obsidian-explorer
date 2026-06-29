import React, {
  forwardRef,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type MutableRefObject,
  type ReactNode,
  type Ref,
} from "react";
import { App, Platform, setTooltip, TFolder } from "obsidian";
import { Search } from "./search";
import { cn } from "./primitives/cn";
import { Gap, Group, Spacer } from "./primitives/layout";
import { Icon } from "./primitives/icon";
import { folderDropProps, MoveIntoFolder } from "../drag-drop";

const settingsPopover = "Customise view";
const newFilePopover = "New note";
const newFolderPopover = "New folder";
const goToParentPopover = "Go to parent folder";
const searchPopover = "Search inside folder";

/* Toolbar components */
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
  popover?: string;
}

export const ToolbarItem = forwardRef<HTMLButtonElement, ToolbarItemProps>(
  ({ icon, active, className, popover, ...rest }, ref) => {
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    useToolbarPopover(buttonRef, popover);

    return (
      <button
        ref={(el) => {
          buttonRef.current = el;
          setForwardedRef(ref, el);
        }}
        type="button"
        className={cn("explorer-toolbar-item", className)}
        data-active={active || undefined}
        data-glass=""
        data-interactive=""
        {...rest}
      >
        <Icon name={icon} />
      </button>
    );
  },
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
  ({ icon, active, className, popover, ...rest }, ref) => {
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    useToolbarPopover(buttonRef, popover);

    return (
      <button
        ref={(el) => {
          buttonRef.current = el;
          setForwardedRef(ref, el);
        }}
        type="button"
        className={cn("explorer-toolbar-group-item", className)}
        data-active={active || undefined}
        {...rest}
      >
        <Icon name={icon} />
      </button>
    );
  },
);
ToolbarGroupItem.displayName = "ToolbarGroupItem";

const SETTINGS_ICON = "settings-2";
const TOOLTIP_DELAY_MS = 600;

function useToolbarPopover(
  ref: MutableRefObject<HTMLElement | null>,
  popover: string | undefined,
): void {
  useEffect(() => {
    if (!ref.current || !popover) return;
    setTooltip(ref.current, popover, {
      placement: "top",
      delay: TOOLTIP_DELAY_MS,
    });
  }, [popover, ref]);
}

function setForwardedRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  (ref as MutableRefObject<T | null>).current = value;
}

export function ExplorerToolbar(props: {
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
  compactToolbar: boolean;
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
    compactToolbar,
  } = props;
  const USE_PEN = false;
  const isMobile = Platform.isMobile;
  const toolbarProps = {
    id: "explorer-toolbar",
    className: cn(
      "explorer-toolbar--explorer",
      compactToolbar && "explorer-toolbar--compact",
    ),
    density: compactToolbar ? ("compact" as const) : undefined,
    fit: isMobile && !compactToolbar ? ("content" as const) : undefined,
  };

  const leadAction = canGoToParent ? (
    <ToolbarItem
      icon="undo-2"
      className="explorer-parent-toolbar-item"
      {...folderDropProps<HTMLButtonElement>(
        app,
        parentDropFolder,
        onMoveIntoFolder,
      )}
      popover={goToParentPopover}
      onClick={() => onGoToParent(false)}
    />
  ) : (
    <ToolbarItem
      icon={SETTINGS_ICON}
      popover={settingsPopover}
      onClick={onOpenSettings}
    />
  );

  if (isMobile && searchMode) {
    return (
      <Toolbar
        {...toolbarProps}
        className={cn(toolbarProps.className, "explorer-toolbar--search")}
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
          <ToolbarGroupItem
            icon="folder-plus"
            popover={newFolderPopover}
            onClick={onNewFolder}
          />
          <Gap inline size=".5em" />
          <ToolbarGroupItem
            icon="file-plus"
            popover={newFilePopover}
            onClick={onNewNote}
          />
          <Gap inline size=".5em" />
          <ToolbarGroupItem
            icon="search"
            popover={searchPopover}
            onClick={onSearchToggle}
          />
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
          <ToolbarGroupItem
            icon={SETTINGS_ICON}
            popover={settingsPopover}
            onClick={onOpenSettings}
          />
          <Gap inline size=".5em" />
          <ToolbarGroupItem
            icon="folder-plus"
            popover={newFolderPopover}
            onClick={onNewFolder}
          />
          <Gap inline size=".5em" />
          <ToolbarGroupItem
            icon="file-plus"
            popover={newFilePopover}
            onClick={onNewNote}
          />
          <Gap inline size=".5em" />
          <ToolbarGroupItem
            icon="search"
            popover={searchPopover}
            onClick={onSearchToggle}
          />
        </ToolbarGroup>
      </Toolbar>
    );
  }
  const DEV = false;
  return (
    <Toolbar {...toolbarProps}>
      <Group gap={2} className="explorer-toolbar__start">
        {leadAction}
      </Group>

      <Spacer />
      {DEV && (
        <>
          <ToolbarGroup>
            <ToolbarGroupItem icon="arrow-up-down" />
            <ToolbarGroupItem icon="layout-grid" />
          </ToolbarGroup>
          <Spacer maxWidth="1em" minWidth=".5em" />
        </>
      )}
      <Group className="explorer-toolbar__end">
        <ToolbarGroup>
          {canGoToParent && (
            <ToolbarGroupItem
              icon={SETTINGS_ICON}
              popover={settingsPopover}
              onClick={onOpenSettings}
            />
          )}
          <ToolbarGroupItem
            icon="folder-plus"
            popover={newFolderPopover}
            onClick={onNewFolder}
          />
          <ToolbarGroupItem
            icon="file-plus-2"
            popover={newFilePopover}
            onClick={onNewNote}
          />
          {onSaveFolderNote && !isMobile && USE_PEN && (
            <ToolbarGroupItem
              icon="pen-line"
              popover="Save folder note as Markdown"
              onClick={onSaveFolderNote}
            />
          )}
        </ToolbarGroup>
        <Gap inline size={compactToolbar ? ".25em" : ".6em"} />
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
