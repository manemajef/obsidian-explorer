# Explorer

**Your vault, from the inside.**

Manage files the way Craft does — drag, rename, reorganize — but from inside
your notes. No sidebar, no context switching, fully local.

Available in the [Obsidian community plugin store](https://community.obsidian.md/plugins/explorer).

![](/assets/main.jpg)

## Why Explorer

- **Work without the sidebar.** Drag notes into folders, rename items, pin
  favorites — all from the note you're already in.
- **Navigate from notes.** Each folder note becomes a live view of its contents,
  with parent navigation, folder buttons, and an optional vault homepage.
- **Shape each view.** Search, show nested content, exclude archives or
  templates from specific blocks. Each Explorer view can be different.
- **Cards or lists.** Sort by edited, name, or date. Paginate, style for
  desktop or mobile. RTL supported.

## Get Started

Add an Explorer block to a folder note:

````markdown
```explorer
```
````

The block displays files from the note's current folder using your default settings.

From the command palette, use:

- `Insert code block` to add Explorer to the current note
- `Create folder in current note folder`

That command creates `Folder/Folder.md`, inserts an Explorer block, and opens the new note.

## Organize In Place

This is where Explorer feels like Craft — but local and private.

On desktop, every Explorer view is a working interface:

- **Drag and drop.** Move notes and folders by dragging them onto any displayed
  folder, or onto the parent button to move up a level.
- **Rename.** Right-click any note or folder. Folder notes stay synced with
  their folders automatically.
- **Pin.** Mark important items so they stay at the top.
- **Delete.** Remove notes or entire folders, with a clear warning before
  anything is gone.

Folder notes and their folders are kept together — rename one, the other
follows. Drag a folder note, and Explorer moves the whole folder after
confirming.

## Screenshots

### Cards

![](/assets/card-view.jpg)

### List

![](/assets/list-view.jpg)

### Settings

![](/assets/settings.jpg)

### Dark Mode

![](/assets/dark-mode.jpg)

## Folder Notes And Homepage

Explorer treats a Markdown file named after its folder as that folder's
navigation page:

```text
Projects/Projects.md
```

When you open a folder from Explorer, the plugin looks for the matching folder note. If it does not exist, Explorer creates it with a basic Explorer block.

Explorer can also use a root-level homepage as a landing page for the vault
and as the destination above a root folder note.

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

`Go to homepage` opens or creates the configured homepage. `Go to parent folder` opens the parent folder note, or the homepage when the current note is already in the vault root and homepage navigation is enabled.

## Configuration

Use plugin settings for your defaults, then tailor individual folder notes
inside their Explorer blocks. For example, this makes a project dashboard that
shows recent content while leaving an archive out of view:

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

`excludedFolders` hides the selected folders and their contents from that
Explorer block only. Plugin settings also include homepage behavior, nested
folder-note display, the parent button, glass controls, card icons, and list
bullets.

## Search

Use the search icon in the action bar to quickly filter the current Explorer
view:

- Plain text searches file names
- `#tag` searches frontmatter tags
- `@name` searches folder notes

Explorer is designed for vaults organized around folders and folder notes. It
complements Dataview, Bases, and tag-driven workflows by making the folder
structure itself useful from inside the editor.

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
