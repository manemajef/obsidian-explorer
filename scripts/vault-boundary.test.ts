import { describe, expect, it } from "vitest";
import {
  appendExplorerBlock,
  replaceExplorerBlock,
} from "../src/explorer/domain/explorer-block-content";
import {
  resolveFolderNoteRenameFromFolder,
  resolveFolderRenameFromFolderNote,
} from "../src/explorer/domain/folder-note-rename";
import { executeFolderRename } from "../src/explorer/domain/folder-rename";
import { resolveExistingCreateTarget } from "../src/explorer/vault/entry-creation";
import { deletionCompleted } from "../src/explorer/vault/entry-deletion";

describe("vault creation and deletion results", () => {
  it("distinguishes an existing entry, a collision, and an open path", () => {
    const folder = { path: "Projects" };

    expect(
      resolveExistingCreateTarget({
        entry: folder,
        occupied: true,
        path: folder.path,
      }),
    ).toEqual({ kind: "existing", entry: folder });
    expect(
      resolveExistingCreateTarget({
        entry: null,
        occupied: true,
        path: folder.path,
      }),
    ).toEqual({ kind: "collision", path: folder.path });
    expect(
      resolveExistingCreateTarget({
        entry: null,
        occupied: false,
        path: folder.path,
      }),
    ).toBeNull();
  });

  it("reports deletion only when the original path is empty", () => {
    expect(deletionCompleted(null)).toBe(true);
    expect(deletionCompleted({ path: "Projects" })).toBe(false);
  });
});

describe("Explorer block content updates", () => {
  it("replaces the exact rendered section without touching surrounding text", () => {
    expect(
      replaceExplorerBlock(
        "before\n```explorer\nold\n```\nafter",
        "```explorer\nnew\n```",
        { lineStart: 1, lineEnd: 3 },
      ),
    ).toBe("before\n```explorer\nnew\n```\nafter");
  });

  it("appends with exactly one separating newline when needed", () => {
    expect(appendExplorerBlock("text", "block")).toBe("text\nblock");
    expect(appendExplorerBlock("text\n", "block")).toBe("text\nblock");
    expect(appendExplorerBlock("", "block")).toBe("block");
  });
});

describe("folder rename rollback", () => {
  it("renames the folder note only after the folder and skips rollback", async () => {
    const events: string[] = [];
    const result = await executeFolderRename({
      hasFolderNote: true,
      renameFolder: async () => {
        events.push("folder");
        return { kind: "renamed" };
      },
      findMovedFolderNote: () => {
        events.push("find-note");
        return "note";
      },
      renameFolderNote: async () => {
        events.push("note");
        return { kind: "renamed" };
      },
      rollBackFolder: async () => {
        events.push("rollback");
        return { kind: "renamed" };
      },
    });

    expect(result).toEqual({ kind: "renamed" });
    expect(events).toEqual(["folder", "find-note", "note"]);
  });

  it("rolls the folder back after a folder-note rename failure", async () => {
    const events: string[] = [];
    const result = await executeFolderRename({
      hasFolderNote: true,
      renameFolder: async () => {
        events.push("folder");
        return { kind: "renamed" };
      },
      findMovedFolderNote: () => "note",
      renameFolderNote: async () => {
        events.push("note");
        return { kind: "failed", error: "blocked" };
      },
      rollBackFolder: async () => {
        events.push("rollback");
        return { kind: "renamed" };
      },
    });

    expect(result).toEqual({
      kind: "folder-note-rename-failed",
      error: "blocked",
      rollbackFailed: false,
    });
    expect(events).toEqual(["folder", "note", "rollback"]);
  });
});

describe("external folder-note rename synchronization", () => {
  it("plans a folder rename only for a matching Markdown folder note", () => {
    expect(
      resolveFolderRenameFromFolderNote({
        extension: "md",
        oldPath: "Projects/Projects.md",
        folderName: "Projects",
        folderPath: "Projects",
        parentPath: "",
        fileBasename: "Work",
        destinationExists: false,
      }),
    ).toEqual({ kind: "rename", destinationPath: "Work" });
  });

  it("reports folder-note destination collisions after a folder rename", () => {
    expect(
      resolveFolderNoteRenameFromFolder({
        oldPath: "Projects",
        folderPath: "Work",
        folderName: "Work",
        oldFolderNotePath: "Work/Projects.md",
        destinationExists: true,
      }),
    ).toEqual({
      kind: "collision",
      destinationPath: "Work/Work.md",
    });
  });
});
