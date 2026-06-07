# Explorer

Browse and organize your vault from inside your notes.

Explorer turns folders and folder notes into file explorer views with navigation,
virtual (file-free) folder views, desktop drag-and-drop, rename, pin, delete, search, and
configurable display options.

Available in the [Obsidian community plugin store](https://community.obsidian.md/plugins/explorer).

![](/assets/main.jpg)

## Features

- Card and list views for folder contents
- Virtual (file-free) folder views and physical Markdown folder notes
- Add or remove physical folder note files with a single button in block settings
- Optional hiding of folder-note files in Obsidian's sidebar explorer
- Interactive folder navigation from the Obsidian sidebar (opening virtual or physical views)
- Desktop drag-and-drop for moving notes and folders
- Context menu actions for moving folders, renaming and deleting items, and pinning notes
- Automatic folder and folder-note renaming synchronization on rename
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

Explorer supports both **physical Markdown folder notes** and **virtual (file-free) folder notes**:

- **Physical folder notes:** A standard Markdown file named after its folder (e.g., `Projects/Projects.md`) containing an `explorer` block. This allows you to add custom text, drawings, or other plugins alongside the Explorer block.
- **Virtual folder notes:** File-free folder views that allow you to browse folders and save custom Explorer setting overrides (such as sort order or card filters) without creating a physical `.md` file on disk. The settings are saved in the plugin's data store (`folder-data.json`).

### Converting between Virtual and Physical

You can easily convert any folder note using the folder note settings modal:

- **Add file:** Materializes a virtual folder note into a physical Markdown file.
- **Remove file:** Deletes the Markdown file from disk (discarding its text content) and reverts it to a virtual note, while preserving all of your Explorer block setting overrides.

### Missing folder notes

When navigating to a folder that does not have a physical Markdown folder note, Explorer can open a temporary (virtual) folder view instead of creating a Markdown note immediately.

The default behavior for new installs is `smart` (`Clicking missing links and edits`):

- Clicking a folder card or button opens a temporary (virtual) folder view.
- Clicking an unresolved folder-note link or choosing to edit/save the view's settings creates the physical Markdown folder note.

Other behaviors can be configured in the plugin settings under **Create missing folder notes when**:

- **Always create** (`create`): Automatically creates a Markdown folder note file when navigating to the folder.
- **Edits only** (`manual`): Keeps the view virtual and only creates a Markdown folder note file when explicitly clicking "Add file" or saving manual edits to the block config.

Existing users upgrading from older versions retain their existing behavior by default.

### Obsidian sidebar

Explorer can hide physical folder-note files from Obsidian's built-in sidebar file tree to reduce clutter.

Additionally, you can enable **Open folder views from sidebar explorer**. When enabled, clicking a folder name in the Obsidian sidebar will open the corresponding folder note view (opening the physical note if it exists, or a virtual folder note view if it does not).

This redirection only handles clicks on the folder name itself. Clicking the collapse/expand arrow or row whitespace retains Obsidian's normal sidebar behavior.

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
- `Save folder note as Markdown`
- `Toggle pin for active note`

`Go to homepage` opens or creates the configured homepage. `Go to parent folder`
opens the parent folder note, a temporary parent folder view, or the homepage
when the current note is already in the vault root and homepage navigation is
enabled. `Save folder note as Markdown` converts a virtual folder note view into a physical Markdown file. `Toggle pin for active note` pins or unpins the active note.

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
| `displayedNotes`  | `supported`, `markdown`, `all`, `none`                |
| `excludedFolders` | Nested folder paths, e.g. `["Archive", "Drafts/Old"]` |
| `textDirection`   | `auto`, `ltr`, `rtl`                                  |

`excludedFolders` hides selected folders and their contents from that Explorer
block only. Plugin-only settings include missing folder-note creation rules, homepage
behavior, reading-mode handling, renaming synchronization, hiding folder notes in
Obsidian's sidebar, opening views from the sidebar click, nested folder-note display,
parent navigation button, glass controls, card icons, and default list/card styles.

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
