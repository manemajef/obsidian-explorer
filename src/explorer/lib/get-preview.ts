import type { App, TFile } from "obsidian";

const DEFAULT_PREVIEW_LENGTH = 500;
const SOURCE_READ_LIMIT = 8000;
type PreviewSegmentKind = "heading" | "paragraph" | "listItem";

export async function getPreviewForNote(
  app: App,
  file: TFile,
): Promise<string | undefined> {
  if (file.extension !== "md") return undefined;

  const content = await app.vault.cachedRead(file);
  if (!content) return "";

  return buildPreviewText(content);
}

export function truncatePreview(
  preview: string | undefined,
  maxLength: number | undefined,
): string | undefined {
  if (!preview || maxLength == null || preview.length <= maxLength) {
    return preview;
  }

  const clipped = preview.slice(0, maxLength + 1);
  const lastSpace = clipped.lastIndexOf(" ");
  const cutAt = lastSpace > Math.floor(maxLength * 0.55) ? lastSpace : maxLength;
  return `${preview.slice(0, cutAt).trimEnd()}...`;
}

export function buildPreviewText(content: string): string {
  let preview = "";
  let previousKind: PreviewSegmentKind | null = null;
  let breakBefore = false;

  for (const line of stripBlocks(content).split(/\r?\n/)) {
    if (!line.trim()) {
      breakBefore = preview.length > 0;
      continue;
    }

    const kind = getPreviewSegmentKind(line);
    const text = cleanLine(line);
    if (!isReadablePreviewLine(text)) {
      continue;
    }

    preview += preview
      ? `${previewSeparator(previousKind, kind, breakBefore, preview)}${text}`
      : text;
    previousKind = kind;
    breakBefore = false;
  }

  return (
    truncatePreview(normalizeWhitespace(preview), DEFAULT_PREVIEW_LENGTH) ?? ""
  );
}

function getPreviewSegmentKind(line: string): PreviewSegmentKind {
  if (/^\s{0,3}#{1,6}\s+/.test(line)) return "heading";
  return /^\s*(?:[-*+]|\d+[.)])\s+/.test(line) ? "listItem" : "paragraph";
}

function previewSeparator(
  previousKind: PreviewSegmentKind | null,
  kind: PreviewSegmentKind,
  breakBefore: boolean,
  previousText: string,
): string {
  if (previousKind === "heading" && kind === "paragraph") return ": ";
  if (previousKind === "listItem" && kind === "listItem") return ", ";
  if (
    previousKind === "paragraph" &&
    kind === "paragraph" &&
    !breakBefore
  ) {
    return " ";
  }

  return sentenceSeparator(previousText);
}

function sentenceSeparator(text: string): string {
  return /[.!?;:]$/.test(text.trimEnd()) ? " " : ". ";
}

function stripBlocks(content: string): string {
  return content
    .slice(0, SOURCE_READ_LIMIT)
    .replace(/^\uFEFF/, "")
    .replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "\n")
    .replace(/^```\s*base\b[\s\S]*?^```\s*$/gim, "\n")
    .replace(/^```[\s\S]*?^```\s*$/gm, "\n")
    .replace(/^~~~[\s\S]*?^~~~\s*$/gm, "\n")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/%%[\s\S]*?%%/g, " ");
}

function cleanLine(line: string): string {
  if ((line.match(/\|/g)?.length ?? 0) >= 2) return "";

  return normalizeWhitespace(
    decodeBasicHtmlEntities(
      line
        .replace(/^\s{0,3}(?:>\s*)+/g, "")
        .replace(/^\[![^\]]+]\s*/g, "")
        .replace(/^#{1,6}\s+/g, "")
        .replace(/^\s*(?:[-*+]|\d+[.)])\s+/g, "")
        .replace(/^\s*\[[ xX/-]\]\s+/g, "")
        .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
        .replace(/\[\[([^\]#|]+)#?[^\]|]*\]\]/g, "$1")
        .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
        .replace(/!\[\[[^\]]+]]/g, " ")
        .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
        .replace(/https?:\/\/\S+/g, " ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\$([^$\n]+)\$/g, (_match, math: string) =>
          cleanInlineMath(math),
        )
        .replace(/<[^>]+>/g, " ")
        .replace(/\^\[[^\]]*]/g, " ")
        .replace(/\[\^[^\]]+]/g, " ")
        .replace(/\s\^[A-Za-z0-9-]+(?=\s|$)/g, " ")
        .replace(/(^|\s)#[\p{L}\p{N}_/-]+(?=\s|$)/gu, " ")
        .replace(/\|/g, " ")
        .replace(/[*_~`]+/g, "")
        .replace(/\\([\\`*_{}/[\]()#+\-.!|>])/g, "$1")
        .replace(/[|]{2,}/g, " ")
        .replace(/[-_=]{4,}/g, " "),
    ),
  );
}

function cleanInlineMath(source: string): string {
  // ponytail: sanitize inline math, use a real renderer if previews need faithful formulas.
  return normalizeWhitespace(
    source
      .replace(/\\frac\s*{([^{}]+)}\s*{([^{}]+)}/g, "$1/$2")
      .replace(/\\[a-zA-Z]+/g, " ")
      .replace(/\\./g, " ")
      .replace(/[{}$^_]/g, " ")
      .replace(/\s*([+\-*=<>])\s*/g, " $1 ")
      .replace(/<\s+=/g, "<=")
      .replace(/>\s+=/g, ">=")
      .replace(/\s*\/\s*/g, "/")
      .replace(/\s*,\s*/g, ", "),
  );
}

function isReadablePreviewLine(line: string): boolean {
  if (!line) return false;
  if (/[>.]base#/i.test(line)) return false;
  if (/^\[![^\]]+]/.test(line)) return false;
  if (/^\s*[-*_]{3,}\s*$/.test(line)) return false;
  if (/^\s*:?-{3,}:?(?:\s*\|\s*:?-{3,}:?)+\s*$/.test(line)) return false;
  if (/^\s*\[\^[^\]]+]:/.test(line)) return false;

  const alphaNumeric = line.match(/[\p{L}\p{N}]/gu)?.length ?? 0;
  return alphaNumeric >= Math.min(3, line.length);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function decodeBasicHtmlEntities(text: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
    apos: "'",
  };

  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const lower = entity.toLowerCase();
    if (lower[0] === "#") {
      const isHex = lower[1] === "x";
      const codePoint = Number.parseInt(
        lower.slice(isHex ? 2 : 1),
        isHex ? 16 : 10,
      );
      return Number.isFinite(codePoint)
        ? String.fromCodePoint(codePoint)
        : match;
    }

    return namedEntities[lower] ?? match;
  });
}
