import { describe, expect, it } from "vitest";
import { resolveFilePresentation } from "../src/explorer/domain/file-opening";
import { canMoveIntoFolder } from "../src/explorer/domain/move-target";
import { resolvePinChange } from "../src/explorer/domain/pin";
import { executeMoveIntoFolder } from "../src/explorer/domain/move-confirmation";

describe("Explorer behavior decisions", () => {
  it("opens ordinary files without folder-page navigation state", () => {
    expect(
      resolveFilePresentation({
        isFolderNote: false,
        forceReadingMode: true,
        request: { newLeaf: true },
      }),
    ).toEqual({
      newLeaf: true,
      markNavigationPending: false,
      forceReadingMode: false,
    });
  });

  it("preserves folder-note pending state and reading-mode policy", () => {
    expect(
      resolveFilePresentation({
        isFolderNote: true,
        forceReadingMode: true,
      }),
    ).toEqual({
      newLeaf: false,
      markNavigationPending: true,
      forceReadingMode: true,
    });
  });

  it("plans only desired pin-state changes", () => {
    expect(resolvePinChange(false, true)).toBe(true);
    expect(resolvePinChange(true, false)).toBe(false);
    expect(resolvePinChange(true, true)).toBeNull();
    expect(resolvePinChange(false, false)).toBeNull();
  });

  it("rejects no-op, self, and descendant folder moves", () => {
    const parent = { path: "Projects" };
    const folder = {
      path: "Projects/Explorer",
      parent,
      isFolder: true,
    };

    expect(canMoveIntoFolder(folder, parent)).toBe(false);
    expect(canMoveIntoFolder(folder, folder)).toBe(false);
    expect(
      canMoveIntoFolder(folder, { path: "Projects/Explorer/Child" }),
    ).toBe(false);
    expect(canMoveIntoFolder(folder, { path: "Archive" })).toBe(true);
  });

  it("allows files to move except into their current parent", () => {
    const file = {
      path: "Projects/Explorer.md",
      parent: { path: "Projects" },
      isFolder: false,
    };

    expect(canMoveIntoFolder(file, { path: "Projects" })).toBe(false);
    expect(canMoveIntoFolder(file, { path: "Archive" })).toBe(true);
  });
});

describe("folder-note move orchestration", () => {
  it("moves only after confirmation and returns the mutation result", async () => {
    const events: string[] = [];
    const changed = await executeMoveIntoFolder({
      confirmMove: async () => {
        events.push("confirm");
        return true;
      },
      move: async () => {
        events.push("move");
        return true;
      },
    });

    expect(changed).toBe(true);
    expect(events).toEqual(["confirm", "move"]);
  });

  it("does not mutate after cancellation", async () => {
    const events: string[] = [];
    const changed = await executeMoveIntoFolder({
      confirmMove: async () => false,
      move: async () => {
        events.push("move");
        return true;
      },
    });

    expect(changed).toBe(false);
    expect(events).toEqual([]);
  });
});
