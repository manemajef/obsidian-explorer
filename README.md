# Explorer

Browse and organize your vault from inside your notes.

Explorer turns folder notes into file explorer views, with navigation,
temporary folder views, desktop drag-and-drop, rename, pin, delete, search, and
configurable display options.

Available in the [Obsidian community plugin store](https://community.obsidian.md/plugins/explorer).

![](/assets/main.jpg)

## Features

- Card and list views for folder contents
- Folder buttons, temporary folder views, and configurable folder-note creation
- Optional hiding of folder-note files in Obsidian's sidebar
- Desktop drag-and-drop for moving notes and folders
- Context menu actions for moving folders, renaming and deleting items, and pinning notes
- Optional matching-folder-note renaming when a folder is renamed
- Optional homepage navigation and homepage opening in new empty tabs
- Per-block exclusion of selected nested folders
- Sorting, pagination, and scoped search within the current Explorer view
- Mobile-friendly layout, optional glass-style controls, and RTL support

## Usage

Add an Explorer block to any folder note:

````markdown
```explorer

```
````

The block displays files from the note's current folder using your default settings.

You can add a block from the command palette with:

- `Insert code block`

You can create a new folder with a matching folder note from:

- `Create folder in current note folder`

That command creates `Folder/Folder.md`, inserts an Explorer block, and opens the new note.

## File Management

On desktop, drag notes and folders onto a displayed folder or onto the parent
button to move them. Dragging a folder note moves its associated folder after
confirmation.

Right-click a note to rename, pin, or delete it, or a folder to rename or
delete it. Rename sync can keep a folder and its matching folder note named
together. Deleting a folder displays a warning before removing its contents.

On mobile, use the context menu instead of drag-and-drop. Long-press a folder
button and use Obsidian's move action to move the folder itself, not just its
folder note.

## Screenshots

### Cards

![](/assets/card-view.jpg)

### List

![](/assets/list-view.jpg)

### Settings

![](/assets/settings.jpg)

### Dark Mode

![](/assets/dark-mode.jpg)

## Navigation

Explorer treats folder notes as navigation pages. A folder note is a Markdown
file named after its folder:

```text
Projects/Projects.md
```

When you open a folder from Explorer, the plugin looks for the matching folder note. If it does not exist, Explorer creates it with a basic Explorer block.

### Missing folder notes

When a folder does not have a matching folder note yet, Explorer can open a
temporary folder view instead of creating a Markdown note immediately.

The default for new installs is `Links and edits`:

- Clicking the folder card opens a temporary folder view.
- Clicking the unresolved folder-note link creates the Markdown folder note.
- Editing or saving a temporary folder view also creates the Markdown folder
  note.

Other modes are available in `Missing folder notes`:

- `Always create` preserves the old behavior and creates missing folder notes
  during navigation.
- `Edits only` creates a folder note only when saving or editing a temporary
  folder view.

Existing users keep the old `Always create` behavior when upgrading unless they
change this setting.

### Obsidian sidebar

Explorer can hide folder-note files from Obsidian's built-in sidebar file tree.
When this is enabled, clicking a folder name in the sidebar can optionally open
the matching folder note, or open a temporary folder note when the Markdown note
does not exist yet.

This only handles clicks on the folder name. The collapse arrow and row
whitespace keep Obsidian's normal sidebar behavior.

### Homepage

Explorer can also use a root-level homepage when navigating above a root
folder note.

By default, homepage navigation is enabled. If the homepage name is left empty, Explorer uses the vault name:

```text
My Vault.md
```

You can change this in plugin settings:

- `Use homepage`
- `Open homepage in new tabs`
- `Homepage name`

The homepage must be a root note name, not a nested path. If the configured homepage does not exist, Explorer creates it with:

````markdown
```explorer
view: "cards"
sortBy: "edited"
depth: 10
pageSize: 21
```
````

If homepage navigation is disabled, the parent button is hidden when it would navigate above a root folder note.

Enable `Open homepage in new tabs` to replace newly opened empty tabs with
the homepage. The option is off by default so installing Explorer does not
change Obsidian's standard blank-tab behavior. This is inactive when the
`New Tab Default Page` community plugin is enabled.

## Commands

Explorer registers these command palette commands:

- `Insert code block`
- `Create folder in current note folder`
- `Go to homepage`
- `Go to parent folder`

`Go to homepage` opens or creates the configured homepage. `Go to parent folder`
opens the parent folder note, a temporary parent folder view, or the homepage
when the current note is already in the vault root and homepage navigation is
enabled.

## Configuration

Most options are available in the plugin settings UI. You can also override
block-specific options inside an Explorer code block:

````markdown
```explorer
view: "cards"
sortBy: "edited"
depth: 2
pageSize: 21
paginationStyle: "modern"
excludedFolders: ["Archive"]
```
````

Supported block settings:

| Setting           | Values                                                |
| ----------------- | ----------------------------------------------------- |
| `view`            | `cards`, `list`                                       |
| `sortBy`          | `newest`, `oldest`, `edited`, `name`, `nameDesc`      |
| `depth`           | `0-10`                                                |
| `paginationStyle` | `modern`, `classic`, `none`                           |
| `pageSize`        | `6-100`                                               |
| `showFolders`     | `true`, `false`                                       |
| `showTags`        | `true`, `false`                                       |
| `cardExt`         | `folder`, `ctime`, `mtime`, `desc`, `none`, `default` |
| `displayedNotes`  | `supported`, `markdown`, `all`, `none`                |
| `excludedFolders` | Nested folder paths, e.g. `["Archive", "Drafts/Old"]` |
| `textDirection`   | `auto`, `ltr`, `rtl`                                  |

`excludedFolders` hides selected folders and their contents from that Explorer
block only. Plugin-only settings include missing folder-note behavior, homepage
behavior, reading-mode handling for folder notes, folder-note rename sync,
Obsidian sidebar folder-note behavior, nested folder-note display, the parent
button, glass controls, card icons, and list style defaults.

## Search

Use the search icon in the action bar to filter the current Explorer view.

- Plain text searches file names
- `#tag` searches frontmatter tags
- `@name` searches folder notes

## Fit

Explorer is designed for vaults organized around folders and folder notes. It
is not a vault-wide query engine and does not try to replace Dataview, Bases,
or tag/database workflows.

## Install

Install from Obsidian's community plugin browser, or clone the repository into your vault:

```bash
git clone https://github.com/manemajef/obsidian-explorer "/path/to/vault/.obsidian/plugins/obsidian-explorer"
```

Then enable Explorer from Obsidian's Community plugins settings.

## Development

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

Run development watch mode:

```bash
npm run dev
```

Lint CSS:

```bash
npm run lint:css
```

## Contributing

Issues and pull requests are welcome. For larger changes, open an issue first so the behavior and scope can be discussed before implementation.

When contributing:

- Keep behavior folder-note focused
- Prefer plugin settings for global behavior and block settings for per-view display
- Keep UI components thin; Explorer behavior lives in `src/explorer/` by feature
- Run `npm run build` before submitting changes

## License

MIT
