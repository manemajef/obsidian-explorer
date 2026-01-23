# Explorer Plugin

A file explorer view for Obsidian that displays folder contents with card, list, and tree views. Supports sorting, pagination, search, and folder notes.

## Usage

Add an `explorer` code block to any note:

````markdown
```explorer

```
````

This will display the contents of the current folder with default settings.

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

### Available Settings

| Setting | Values | Default | Description |
|---------|--------|---------|-------------|
| `sortBy` | `newest`, `oldest`, `edited`, `name` | `newest` | How to sort files |
| `sortDir` | `asc`, `desc` | `desc` | Sort direction |
| `view` | `cards`, `list`, `tree` | `cards` | Display mode |
| `depth` | `0-10` | `0` | Subfolder depth (0 = direct children only) |
| `pageSize` | `6-100` | `12` | Items per page |
| `onlyNotes` | `true`, `false` | `true` | Show only .md and .pdf files |
| `showFolders` | `true`, `false` | `true` | Show folder buttons |
| `searchEnabled` | `true`, `false` | `true` | Show search bar |
| `cardExt` | `folder`, `ctime`, `mtime`, `desc`, `none` | `ctime` | Card footer info |
| `autoCollapseTree` | `true`, `false` | `false` | Start tree view collapsed |

## Features

### View Modes

- **Cards**: Grid of cards showing file name, extension, and metadata
- **List**: Simple bulleted list of files
- **Tree**: Hierarchical view with collapsible folders

### Search

The search bar supports special prefixes:
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

## Architecture

The plugin uses a single TypeScript file (`main.ts`) that includes:

- **ExplorerPlugin**: Main plugin class that registers the code block processor
- **ExplorerView**: Handles rendering and user interactions
- **FolderIndex**: Queries and indexes folder contents with async loading
- **ExplorerSettingsModal**: Native Obsidian modal for settings

Settings are stored directly in the code block, making them portable and per-note.

## Differences from Original (datacore version)

| Aspect | Original | New Plugin |
|--------|----------|------------|
| React | Uses datacore for React integration | Native Obsidian DOM manipulation |
| State Storage | JSON cache file | Stored in code block |
| Dependencies | Requires datacore plugin | Standalone |
| Settings | Global cache | Per-block settings |
| Performance | Queries via datacore | Direct vault API |

## License

MIT
