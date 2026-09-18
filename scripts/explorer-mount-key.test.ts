import { describe, expect, it } from "vitest";
import { resolveExplorerMountKey } from "../src/explorer/domain/explorer-mount-key";

describe("Explorer mount identity", () => {
  it("keeps render documents for the same file and block separate", () => {
    const reading = resolveExplorerMountKey({
      docId: "reading-document",
      sourcePath: "Projects/Projects.md",
      lineStart: 4,
      lineEnd: 6,
      blockConfig: "{}",
    });
    const livePreview = resolveExplorerMountKey({
      docId: "editor-document",
      sourcePath: "Projects/Projects.md",
      lineStart: 4,
      lineEnd: 6,
      blockConfig: "{}",
    });

    expect(reading).not.toBe(livePreview);
  });

  it("reuses identity for replacement containers in one document", () => {
    const input = {
      docId: "reading-document",
      sourcePath: "Projects/Projects.md",
      lineStart: 4,
      lineEnd: 6,
      blockConfig: "{}",
    };

    expect(resolveExplorerMountKey(input)).toBe(
      resolveExplorerMountKey(input),
    );
  });

  it("does not reuse a mount after block settings change", () => {
    const base = {
      docId: "reading-document",
      sourcePath: "Projects/Projects.md",
      lineStart: 4,
      lineEnd: 6,
    };

    expect(
      resolveExplorerMountKey({ ...base, blockConfig: "{}" }),
    ).not.toBe(
      resolveExplorerMountKey({
        ...base,
        blockConfig: "{\"sort\":\"modified\"}",
      }),
    );
  });

  it("declines reuse when Obsidian cannot identify the section", () => {
    expect(
      resolveExplorerMountKey({
        docId: "reading-document",
        sourcePath: "Projects/Projects.md",
        lineStart: null,
        lineEnd: null,
        blockConfig: "{}",
      }),
    ).toBeNull();
  });
});
