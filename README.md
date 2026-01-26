# Explorer Plugin

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

![](/assets/card-view.png)

### List View

![](/assets/list-view.png)

### Settings

![](/assets/settings.png)

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

#### Global defaults (Settings → Explorer)

| Setting           | Values                                               | Default  | Description                                |
| ----------------- | ---------------------------------------------------- | -------- | ------------------------------------------ |
| `sortBy`          | `newest`, `oldest`, `edited`, `name`                 | `oldest` | How to sort files                          |
| `view`            | `cards`, `list`                                      | `list`   | Display mode                               |
| `depth`           | `0-10`                                               | `0`      | Subfolder depth (0 = direct children only) |
| `pageSize`        | `6-100`                                              | `15`     | Items per page                             |
| `onlyNotes`       | `true`, `false`                                      | `false`  | Show only .md and .pdf files               |
| `showFolders`     | `true`, `false`                                      | `true`   | Show folder buttons                        |
| `showBreadcrumbs` | `true`, `false`                                      | `false`  | Show navigation breadcrumbs                |
| `cardExt`         | `folder`, `ctime`, `mtime`, `desc`, `none`, `default`| `default`| Card footer info                           |
| `showNotes`       | `true`, `false`                                      | `true`   | Show note files                            |
| `useGlass`        | `true`, `false`                                      | `true`   | Glass styling (global only)                |

#### Per-block overrides (inside the `explorer` code block)

You can override these settings per block. Keys not listed here are ignored.

| Setting           | Values                                               |
| ----------------- | ---------------------------------------------------- |
| `sortBy`          | `newest`, `oldest`, `edited`, `name`                 |
| `view`            | `cards`, `list`                                      |
| `depth`           | `0-10`                                               |
| `pageSize`        | `6-100`                                              |
| `onlyNotes`       | `true`, `false`                                      |
| `showFolders`     | `true`, `false`                                      |
| `showBreadcrumbs` | `true`, `false`                                      |
| `cardExt`         | `folder`, `ctime`, `mtime`, `desc`, `none`, `default`|
| `showNotes`       | `true`, `false`                                      |

## Features

### View Modes

- **Cards**: Grid of cards showing file name, extension, and metadata
- **List**: Simple bulleted list of files

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

## Architecture

The plugin uses a modular TypeScript/React architecture:

```
main.ts                    # Plugin entry point, registers code block processor
src/
├── types.ts               # TypeScript interfaces
├── constants.ts           # Default settings
├── services/
│   ├── folder-index.ts    # Queries and indexes folder contents
│   └── settings-parser.ts # Parses/serializes code block settings
├── ui/
│   ├── explorer-view.tsx  # Main view controller
│   ├── explorer-ui.tsx    # Root React component
│   ├── settings-tab.ts    # Plugin settings tab
│   ├── components/        # Reusable React components
│   │   ├── cards-view.tsx
│   │   ├── list-view.tsx
│   │   ├── search-bar.tsx
│   │   ├── breadcrumbs.tsx
│   │   ├── pagination.tsx
│   │   └── shared.tsx     # Icon, InternalLink components
│   └── modals/
│       ├── settings-modal.ts
│       └── prompt-modal.ts
└── utils/
    ├── file-utils.ts      # File/folder note utilities
    ├── helpers.ts         # RTL detection, etc.
    └── link-utils.ts      # Internal link handling
```

Settings have global defaults (plugin settings tab) with optional per-block overrides in the code block.

## Differences from Original (datacore version)

| Aspect        | Original                            | New Plugin                       |
| ------------- | ----------------------------------- | -------------------------------- |
| React         | Uses datacore for React integration | Native Obsidian DOM manipulation |
| State Storage | JSON cache file                     | Stored in code block             |
| Dependencies  | Requires datacore plugin            | Standalone                       |
| Settings      | Global cache                        | Per-block settings               |
| Performance   | Queries via datacore                | Direct vault API                 |

## License

MIT
