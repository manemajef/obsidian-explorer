#!/usr/bin/env python3
"""Generate a demo Obsidian vault for stress-testing the explorer plugin.

Usage:
    python scripts/generate-demo-vault.py <output-dir>
        [--files 20000] [--folders 40] [--max-depth 3] [--seed 0]

Creates a folder tree with markdown notes, folder notes, frontmatter
(tags / pin / description), and a sprinkle of other extensions so the
displayedNotes filter has something to do.
"""

from __future__ import annotations

import argparse
import random
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
import subprocess

SCRIPT_DIR = Path(__file__).resolve().parent
EXPLORER_DIR = (SCRIPT_DIR / "../").resolve()

WORDS = [
    "alpha",
    "beta",
    "gamma",
    "delta",
    "epsilon",
    "zeta",
    "eta",
    "theta",
    "project",
    "meeting",
    "idea",
    "note",
    "draft",
    "todo",
    "review",
    "spec",
    "design",
    "research",
    "log",
    "journal",
    "recipe",
    "trip",
    "book",
    "movie",
    "quote",
    "thought",
    "snippet",
    "config",
    "playbook",
    "retrospective",
    "kickoff",
    "postmortem",
    "sketch",
    "outline",
    "summary",
    "brief",
]

TAGS_POOL = [
    "work",
    "personal",
    "idea",
    "todo",
    "archive",
    "reference",
    "draft",
    "important",
    "research/active",
    "research/done",
    "writing",
    "review",
    "trip/asia",
    "trip/europe",
    "recipe/dinner",
    "recipe/dessert",
]

EXTRA_EXTS = [("pdf", 30), ("base", 20), ("png", 10), ("canvas", 5)]
MAX_PINNED_NOTES = 8


@dataclass
class FrontmatterState:
    pinned_count: int = 0
    max_pinned: int = MAX_PINNED_NOTES


def slugify(name: str) -> str:
    return "".join(c if c.isalnum() else "-" for c in name).strip("-").lower()


def make_folder_name(rng: random.Random, used: set[str]) -> str:
    while True:
        name = f"{rng.choice(WORDS).capitalize()} {rng.choice(WORDS)}"
        if name not in used:
            used.add(name)
            return name


def make_file_basename(rng: random.Random) -> str:
    return f"{rng.choice(WORDS)}-{rng.choice(WORDS)}-{rng.randint(1, 9999)}"


def make_frontmatter(rng: random.Random, state: FrontmatterState) -> str | None:
    fields: list[str] = []
    if rng.random() < 0.4:
        n = rng.randint(1, 3)
        tags = rng.sample(TAGS_POOL, n)
        fields.append("tags:")
        fields.extend(f"  - {t}" for t in tags)
    if rng.random() < 0.08 and state.pinned_count < state.max_pinned:
        fields.append("pin: true")
        state.pinned_count += 1
    if rng.random() < 0.3:
        desc = " ".join(rng.choices(WORDS, k=rng.randint(4, 10)))
        fields.append(f"description: {desc}")
    if not fields:
        return None
    return "---\n" + "\n".join(fields) + "\n---\n"


def make_body(rng: random.Random) -> str:
    paragraphs = []
    for _ in range(rng.randint(1, 4)):
        words = rng.choices(WORDS, k=rng.randint(20, 60))
        paragraphs.append(" ".join(words).capitalize() + ".")
    return "\n\n".join(paragraphs) + "\n"


def build_folder_tree(
    rng: random.Random, root: Path, n_folders: int, max_depth: int
) -> list[Path]:
    folders: list[Path] = [root]
    used_names: set[str] = set()
    while len(folders) - 1 < n_folders:
        parent_candidates = [
            f for f in folders if len(f.relative_to(root).parts) < max_depth
        ]
        parent = rng.choice(parent_candidates)
        name = make_folder_name(rng, used_names)
        new_folder = parent / name
        new_folder.mkdir(parents=True, exist_ok=False)
        folders.append(new_folder)
    return folders


def write_markdown(path: Path, rng: random.Random, state: FrontmatterState) -> None:
    parts = [
        make_frontmatter(rng, state),
        f"# {path.stem.replace('-', ' ').title()}\n\n",
        make_body(rng),
    ]
    path.write_text("".join(p for p in parts if p), encoding="utf-8")


def write_extra(path: Path) -> None:
    path.write_bytes(b"")


def write_folder_notes(
    rng: random.Random, folders: list[Path], root: Path, state: FrontmatterState
) -> int:
    count = 0
    for folder in folders:
        if folder == root:
            continue
        if rng.random() < 0.5:
            note = folder / f"{folder.name}.md"
            if not note.exists():
                fm = make_frontmatter(rng, state) or ""
                note.write_text(f"{fm}\n```explorer\n```\n", encoding="utf-8")
                count += 1
    return count


def populate_files(
    rng: random.Random, folders: list[Path], n_files: int, state: FrontmatterState
) -> tuple[int, int]:
    md_count = 0
    extra_count = 0
    extra_total = sum(weight for _, weight in EXTRA_EXTS)

    for _ in range(n_files):
        folder = rng.choice(folders)
        # 1 in ~10 chance of writing a non-md file
        if rng.random() < 0.1:
            roll = rng.randint(0, extra_total - 1)
            cursor = 0
            chosen_ext = "pdf"
            for ext, w in EXTRA_EXTS:
                cursor += w
                if roll < cursor:
                    chosen_ext = ext
                    break
            base = make_file_basename(rng)
            path = folder / f"{base}.{chosen_ext}"
            if path.exists():
                continue
            write_extra(path)
            extra_count += 1
        else:
            base = make_file_basename(rng)
            path = folder / f"{base}.md"
            if path.exists():
                continue
            write_markdown(path, rng, state)
            md_count += 1
    return md_count, extra_count


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="Path to create the vault at")
    parser.add_argument("--files", type=int, default=20_000)
    parser.add_argument("--folders", type=int, default=40)
    parser.add_argument("--max-depth", type=int, default=3)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument(
        "--force",
        action="store_true",
        help="Delete the output directory first if it exists",
    )
    args = parser.parse_args()

    root: Path = args.output.resolve()
    if root.exists():
        if not args.force:
            print(
                f"Refusing to write into existing path {root} — pass --force to wipe.",
                file=sys.stderr,
            )
            return 1
        shutil.rmtree(root)
    root.mkdir(parents=True)

    # Mark as an Obsidian vault so it opens cleanly.
    obsidian_dir = root / ".obsidian"
    plugins_dir = obsidian_dir / "plugins"
    obsidian_dir.mkdir()
    plugins_dir.mkdir()
    (plugins_dir / "explorer").symlink_to(EXPLORER_DIR, target_is_directory=True)

    hot_reload_dir = plugins_dir / "hot-reload"
    subprocess.run(
        [
            "git",
            "clone",
            "https://github.com/pjeby/hot-reload.git",
            str(hot_reload_dir),
        ],
        check=True,
    )
    shutil.rmtree(hot_reload_dir / ".git")

    rng = random.Random(args.seed)
    frontmatter_state = FrontmatterState()
    print(
        f"Building {args.folders} folders under {root} (max depth {args.max_depth})..."
    )
    folders = build_folder_tree(rng, root, args.folders, args.max_depth)

    print("Writing folder notes...")
    fn_count = write_folder_notes(rng, folders, root, frontmatter_state)

    print(f"Writing ~{args.files} files...")
    md_count, extra_count = populate_files(rng, folders, args.files, frontmatter_state)

    print(
        f"Done. Folders: {len(folders) - 1}, folder notes: {fn_count}, "
        f"md files: {md_count}, extras: {extra_count}, pins: "
        f"{frontmatter_state.pinned_count}, total files: "
        f"{md_count + extra_count + fn_count}"
    )
    print(f"Open in Obsidian: {root}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
