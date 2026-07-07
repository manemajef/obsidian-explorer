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
import { App, Menu, Platform, setTooltip, TFolder } from "obsidian";
import { Search } from "./search";
import { cn } from "./primitives/cn";
import { Gap, Group, Spacer } from "./primitives/layout";
import { Icon } from "./primitives/icon";
import { folderDropProps, MoveIntoFolder } from "../drag-drop";
import type { BlockSettings, SortBy } from "../../explorer/settings";

const settingsPopover = "Customise view";
const newFilePopover = "New note";
const newFolderPopover = "New folder";
const goToParentPopover = "Go to parent folder";
const sortPopover = "Sort";
const viewPopover = "View";

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
    const ariaLabel = rest["aria-label"] ?? popover;

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
        aria-label={ariaLabel}
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
    const ariaLabel = rest["aria-label"] ?? popover;

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
        aria-label={ariaLabel}
      >
        <Icon name={icon} />
      </button>
    );
  },
);
ToolbarGroupItem.displayName = "ToolbarGroupItem";

export interface ToolbarGroupMenuItemProps extends ToolbarItemProps {
  enumIcon?: boolean;
}

export const ToolbarGroupMenuItem = forwardRef<
  HTMLButtonElement,
  ToolbarGroupMenuItemProps
>(({ icon, enumIcon, active, className, popover, ...rest }, ref) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  useToolbarPopover(buttonRef, popover);
  const ariaLabel = rest["aria-label"] ?? popover;

  return (
    <button
      ref={(el) => {
        buttonRef.current = el;
        setForwardedRef(ref, el);
      }}
      type="button"
      className={cn("explorer-toolbar-group-menu-item", className)}
      data-active={active || undefined}
      {...rest}
      aria-label={ariaLabel}
    >
      <Icon name={icon} />
      {enumIcon && (
        <Icon
          name="chevrons-up-down"
          className="explorer-toolbar-group-menu-item__enum-icon"
        />
      )}
    </button>
  );
});
ToolbarGroupMenuItem.displayName = "ToolbarGroupMenuItem";

const SETTINGS_ICON = "settings-2";
const TOOLTIP_DELAY_MS = 600;
const SORT_OPTIONS: Array<{ value: SortBy; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "edited", label: "Last edited" },
  { value: "name", label: "Name" },
  { value: "nameDesc", label: "Name (reverse)" },
];
const VIEW_OPTIONS: Array<{
  label: string;
  icon: string;
  settings: Pick<BlockSettings, "view"> &
    Partial<Pick<BlockSettings, "listStyle">>;
}> = [
  { label: "Cards", icon: "layout-grid", settings: { view: "cards" } },
  {
    label: "Markdown list",
    icon: "list",
    settings: { view: "list", listStyle: "markdown" },
  },
  {
    label: "Modern list",
    icon: "rows-3",
    settings: { view: "list", listStyle: "modern" },
  },
  // {
  //   label: "Plain list",
  //   icon: "list",
  //   settings: { view: "list", listStyle: "plain" },
  // },
];

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

function showToolbarMenu(
  button: HTMLButtonElement,
  build: (menu: Menu) => void,
): void {
  const rect = button.getBoundingClientRect();
  const menu = new Menu().setUseNativeMenu(true);
  build(menu);
  menu.showAtPosition(
    { x: rect.left, y: rect.bottom, width: rect.width },
    button.ownerDocument,
  );
}

function getCurrentViewIcon(settings: BlockSettings): string {
  if (settings.view === "cards") return "layout-grid";
  if (settings.listStyle === "modern") return "rows-3";
  return "list";
}

function isCurrentView(
  settings: BlockSettings,
  option: (typeof VIEW_OPTIONS)[number]["settings"],
): boolean {
  if (settings.view !== option.view) return false;
  return settings.view === "cards" || settings.listStyle === option.listStyle;
}

function ExtendedToolbarGroup(props: {
  settings: BlockSettings;
  withSettings: boolean;
  onOpenSettings: () => void;
  onSettingsChange: (settings: BlockSettings) => void;
}): React.JSX.Element {
  const { settings, withSettings, onOpenSettings, onSettingsChange } = props;

  return (
    <ToolbarGroup>
      {withSettings && (
        <ToolbarGroupItem
          icon={SETTINGS_ICON}
          popover={settingsPopover}
          onClick={onOpenSettings}
        />
      )}
      <span className="explorer-toolbar__extended-menu">
        <SortMenuButton settings={settings} onSettingsChange={onSettingsChange} />
        <ViewMenuButton settings={settings} onSettingsChange={onSettingsChange} />
      </span>
    </ToolbarGroup>
  );
}

function SortMenuButton(props: {
  settings: BlockSettings;
  onSettingsChange: (settings: BlockSettings) => void;
}): React.JSX.Element {
  const { settings, onSettingsChange } = props;

  return (
    <ToolbarGroupItem
      icon="arrow-down-up"
      popover={sortPopover}
      onClick={(event) => {
        showToolbarMenu(event.currentTarget, (menu) => {
          for (const option of SORT_OPTIONS) {
            menu.addItem((item) => {
              item
                .setTitle(option.label)
                .setChecked(settings.sortBy === option.value)
                .onClick(() => {
                  onSettingsChange({
                    ...settings,
                    sortBy: option.value,
                  });
                });
            });
          }
        });
      }}
    />
  );
}

function ViewMenuButton(props: {
  settings: BlockSettings;
  onSettingsChange: (settings: BlockSettings) => void;
}): React.JSX.Element {
  const { settings, onSettingsChange } = props;

  return (
    <ToolbarGroupMenuItem
      icon={getCurrentViewIcon(settings)}
      enumIcon
      popover={viewPopover}
      onClick={(event) => {
        showToolbarMenu(event.currentTarget, (menu) => {
          for (const option of VIEW_OPTIONS) {
            menu.addItem((item) => {
              item
                .setTitle(option.label)
                .setIcon(option.icon)
                .setChecked(isCurrentView(settings, option.settings))
                .onClick(() => {
                  onSettingsChange({
                    ...settings,
                    ...option.settings,
                  });
                });
            });
          }
        });
      }}
    />
  );
}

export function ExplorerToolbar(props: {
  app: App;
  settings: BlockSettings;
  parentDropFolder: TFolder | null;
  onMoveIntoFolder: MoveIntoFolder;
  onOpenSettings: () => void;
  onSettingsChange: (settings: BlockSettings) => void;
  onSaveFolderNote?: () => void;
  onGoToParent: (newLeaf: boolean) => void;
  onNewFolder: () => void;
  onNewNote: () => void;
  onSearchToggle: () => void;
  searchMode: boolean;
  searchQuery: string;
  onSearchInput: (query: string) => void;
  canGoToParent: boolean;
  disableGlassToolbar: boolean;
}): React.JSX.Element {
  const {
    app,
    settings,
    parentDropFolder,
    onMoveIntoFolder,
    onOpenSettings,
    onSettingsChange,
    onSaveFolderNote,
    onGoToParent,
    onNewFolder,
    onNewNote,
    searchMode,
    searchQuery,
    onSearchToggle,
    onSearchInput,
    canGoToParent,
    disableGlassToolbar,
  } = props;
  const USE_PEN = false;
  const isMobile = Platform.isMobile;
  const extendedToolbar = settings.extendedToolbar;
  const toolbarProps = {
    id: "explorer-toolbar",
    className: cn(
      "explorer-toolbar--explorer",
      disableGlassToolbar && "explorer-toolbar--compact",
    ),
    density: disableGlassToolbar ? ("compact" as const) : undefined,
    fit: isMobile && !disableGlassToolbar ? ("content" as const) : undefined,
  };

  const settingsAction = (
    <ToolbarItem
      icon={SETTINGS_ICON}
      popover={settingsPopover}
      onClick={onOpenSettings}
    />
  );
  const parentAction = (
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

  return (
    <Toolbar {...toolbarProps}>
      <Group gap={2} className="explorer-toolbar__start">
        {canGoToParent && parentAction}
        {!canGoToParent && settingsAction}
      </Group>

      <Spacer />

      <Group className="explorer-toolbar__end">
        {extendedToolbar && (
          <span
            className="explorer-toolbar__extended-slot"
            data-with-settings={canGoToParent || undefined}
          >
            <Gap inline size=".35em" />
            <ExtendedToolbarGroup
              settings={settings}
              withSettings={canGoToParent}
              onOpenSettings={onOpenSettings}
              onSettingsChange={onSettingsChange}
            />
            <Gap inline size=".6em" />
          </span>
        )}
        <ToolbarGroup>
          {canGoToParent && (
            <ToolbarGroupItem
              icon={SETTINGS_ICON}
              className={
                extendedToolbar
                  ? "explorer-toolbar__fallback-settings"
                  : undefined
              }
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
        <Gap inline size={disableGlassToolbar ? ".25em" : ".6em"} />
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
