import { describe, expect, it } from "vitest";
import {
  buildPreviewText,
  truncatePreview,
} from "../src/explorer/lib/get-preview";

describe("preview parsing", () => {
  it("skips frontmatter, code blocks, tables, comments, tags, and embeds", () => {
    const preview = buildPreviewText(`---
pin: true
---

# Project notes

![cover](cover.png)

Useful [[Targets|target list]] with #private and [docs](https://example.com).

| A | B |
|---|---|
| 1 | 2 |

\`\`\`
ignored code
\`\`\`

<!-- hidden -->
`);

    expect(preview).toBe("Project notes: Useful target list with and docs.");
  });

  it("joins adjacent list items with commas", () => {
    expect(
      buildPreviewText(`- first item
- second item
- third item`),
    ).toBe("first item, second item, third item");
  });

  it("sanitizes inline math without rendering it", () => {
    expect(
      buildPreviewText("Formula $\\frac{a}{b} + x_1$ stays readable."),
    ).toBe("Formula a/b + x 1 stays readable.");
  });

  it("truncates at a word boundary when possible", () => {
    expect(truncatePreview("alpha beta gamma delta", 12)).toBe("alpha beta...");
  });
});
