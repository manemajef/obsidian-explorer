# Explorer Plugin

![](/assets/main.jpg)
A file explorer view for Obsidian that displays folder contents with card and list views. Supports sorting, pagination, search, and folder notes.

## Usage

Add an `explorer` code block to any note:

````markdown
```explorer

```
````

This will display the contents of the current folder with default settings.

## Example

### Card View

![](/assets/card-view.jpg)

### List View

![](/assets/list-view.jpg)

### Settings

![](/assets/settings.jpg)

### Dark Mode

![](/assets/dark-mode.jpg)

### Configuration

You can customize the view by adding settings to the code block:

````markdown
```explorer
sortBy: "newest"
view: "cards"
depth: 2
pageSize: 12
```
````

### Download

**clone repo**
for mac or linux:

```bash
git clone https://github.com/manemajef/obsidian-explorer "/path/to/your/vault/.obsidian/plugins/obsidian-explorer"
```

for windows:

```PowerShell
git clone https://github.com/manemajef/obsidian-explorer "C:\Path\To\Your\Vault\.obsidian\plugins\obsidian-explorer"
```

**Activate plugins**

- Open Obsidian → Settings → Community plugins
- Turn on “Explorer”

### Settings

#### Per-block overrides (inside the `explorer` code block)

You can override these settings per block. Keys not listed here are ignored.

| Setting       | Values                                                |
| ------------- | ----------------------------------------------------- |
| `sortBy`      | `newest`, `oldest`, `edited`, `name`                  |
| `view`        | `cards`, `list`                                       |
| `depth`       | `0-10`                                                |
| `pageSize`    | `6-100`                                               |
| `onlyNotes`   | `true`, `false`                                       |
| `showFolders` | `true`, `false`                                       |
| `cardExt`     | `folder`, `ctime`, `mtime`, `desc`, `none`, `default` |
| `showNotes`   | `true`, `false`                                       |

## Features

### View Modes

- **Cards**: Grid of cards showing file name, extension, and metadata
- **List**: Simple bulleted list of files

### Folder Notes

- autumaticly creates a folder note if missing as `path/to/foldername/foldername.md`
- If foldernotes exist, it dosnt ovverride them
- Plays well with [Obsidian Folder Note Plugin](https://github.com/LostPaul/obsidian-folder-notes), but works without it as well

### Search

The search bar supports special prefixes. Use the search icon in the top bar to toggle it.

- Normal text: Search by filename
- `#tag`: Search by tags in frontmatter
- `@name`: Search only folder notes

### Folder Notes

The plugin recognizes folder notes (files named `foldername/foldername.md`) and:

- Uses them for folder navigation
- Shows them in breadcrumbs
- Filters them correctly from file listings

### Pinned Files

Files with `pin: true` or `fav: true` in frontmatter are shown at the top with a heart icon.

### RTL Support

Automatically detects Hebrew/Arabic text and adjusts breadcrumb icons accordingly.

## Development

### Building

```bash
npm install
npm run build
```

### Development Mode

```bash
npm run dev
```

## License

MIT
