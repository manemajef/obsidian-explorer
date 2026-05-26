# Explorer

Explorer is an Obsidian plugin for browsing folder contents directly inside a note. It is built for folder-based vaults where folder notes act as navigation hubs.

Available in the [Obsidian community plugin store](https://community.obsidian.md/plugins/explorer).

![](/assets/main.jpg)

## Features

- Card and list views for folder contents
- Folder buttons for moving through subfolders
- Automatic folder-note creation
- Optional homepage navigation
- Parent folder and homepage commands
- Sorting by name, created time, or modified time
- Pagination for large folders
- Scoped search within the current explorer
- Mobile-friendly layout
- Optional glass-style controls
- RTL support for Hebrew and Arabic workflows

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

Explorer treats folder notes as navigation pages. A folder note is a Markdown file named after its folder:

```text
Projects/Projects.md
```

When you open a folder from Explorer, the plugin looks for the matching folder note. If it does not exist, Explorer creates it with a basic Explorer block.

### Homepage

Explorer can also use a root-level homepage when navigating above a root folder note.

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

Most options are available in the plugin settings UI. You can also override block-specific options inside an Explorer code block:

````markdown
```explorer
view: "cards"
sortBy: "edited"
depth: 2
pageSize: 21
paginationStyle: "modern"
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
| `textDirection`   | `auto`, `ltr`, `rtl`                                  |

Plugin-only settings include homepage behavior, the parent button, glass controls, card icons, and list bullets.

## Search

Use the search icon in the action bar to filter the current Explorer view.

- Plain text searches file names
- `#tag` searches frontmatter tags
- `@name` searches folder notes



## Fit

Explorer is designed for vaults organized around folders and folder notes. It is not a vault-wide query engine and does not try to replace Dataview, Bases, or tag/database workflows.

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
