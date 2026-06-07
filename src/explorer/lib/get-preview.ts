import type { App, TFile } from "obsidian";

const DEFAULT_PREVIEW_LENGTH = 500;
const SOURCE_READ_LIMIT = 8000;
type PreviewSegmentKind = "heading" | "paragraph" | "listItem";

type PreviewSegment = {
  breakBefore: boolean;
  kind: PreviewSegmentKind;
  text: string;
};
const LATEX_COMMANDS: Record<string, string> = {
  alpha: "alpha",
  beta: "beta",
  cdot: "*",
  cos: "cos",
  delta: "delta",
  Delta: "Delta",
  div: "/",
  dots: "...",
  gamma: "gamma",
  Gamma: "Gamma",
  ge: ">=",
  infty: "infinity",
  int: "int",
  lambda: "lambda",
  Lambda: "Lambda",
  le: "<=",
  left: "",
  log: "log",
  max: "max",
  min: "min",
  neq: "!=",
  pi: "pi",
  pm: "+/-",
  right: "",
  sin: "sin",
  sqrt: "sqrt",
  sum: "sum",
  theta: "theta",
  Theta: "Theta",
  times: "*",
};

const SUPERSCRIPT_CHARS: Record<string, string> = {
  "+": "⁺",
  "-": "⁻",
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "=": "⁼",
  i: "ⁱ",
  n: "ⁿ",
};

const SUBSCRIPT_CHARS: Record<string, string> = {
  "+": "₊",
  "-": "₋",
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
  "=": "₌",
  a: "ₐ",
  e: "ₑ",
  h: "ₕ",
  i: "ᵢ",
  j: "ⱼ",
  k: "ₖ",
  l: "ₗ",
  m: "ₘ",
  n: "ₙ",
  o: "ₒ",
  p: "ₚ",
  r: "ᵣ",
  s: "ₛ",
  t: "ₜ",
  u: "ᵤ",
  v: "ᵥ",
  x: "ₓ",
};

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
  const preview = serializePreviewSegments(readPreviewSegments(content));
  return truncatePreview(preview, DEFAULT_PREVIEW_LENGTH) ?? "";
}

function readPreviewSegments(content: string): PreviewSegment[] {
  const segments: PreviewSegment[] = [];
  let breakBefore = false;

  for (const line of stripBlocks(content).split(/\r?\n/)) {
    if (!line.trim()) {
      breakBefore = segments.length > 0;
      continue;
    }

    const segment = parsePreviewSegment(line, breakBefore);
    if (segment) {
      segments.push(segment);
      breakBefore = false;
    }
  }

  return segments;
}

function parsePreviewSegment(
  line: string,
  breakBefore: boolean,
): PreviewSegment | null {
  const kind = getPreviewSegmentKind(line);
  const text = cleanLine(line);

  if (!isReadablePreviewLine(text)) return null;

  return { breakBefore, kind, text };
}

function getPreviewSegmentKind(line: string): PreviewSegmentKind {
  if (/^\s{0,3}#{1,6}\s+/.test(line)) return "heading";
  return /^\s*(?:[-*+]|\d+[.)])\s+/.test(line) ? "listItem" : "paragraph";
}

function serializePreviewSegments(segments: PreviewSegment[]): string {
  let preview: PreviewSegment | null = null;

  for (const segment of segments) {
    if (!preview) {
      preview = segment;
      continue;
    }

    preview = joinPreviewSegments(preview, segment);
  }

  return normalizeWhitespace(preview?.text ?? "");
}

function joinPreviewSegments(
  previous: PreviewSegment,
  segment: PreviewSegment,
): PreviewSegment {
  return {
    breakBefore: false,
    kind: segment.kind,
    text: `${previous.text}${previewSeparator(previous, segment)}${segment.text}`,
  };
}

function previewSeparator(
  previous: PreviewSegment,
  segment: PreviewSegment,
): string {
  if (previous.kind === "heading" && segment.kind === "paragraph") return ": ";
  if (previous.kind === "listItem" && segment.kind === "listItem") return ", ";
  if (
    previous.kind === "paragraph" &&
    segment.kind === "paragraph" &&
    !segment.breakBefore
  ) {
    return " ";
  }

  return sentenceSeparator(previous.text);
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
          processInlineMath(math),
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

function processInlineMath(source: string): string {
  let math = source
    .replace(
      /\\frac\s*{([^{}]+)}\s*{([^{}]+)}/g,
      (_match: string, top: string, bottom: string) => {
        return `${formatFractionPart(top)}/${formatFractionPart(bottom)}`;
      },
    )
    .replace(/\\(?:left|right)\s*/g, "")
    .replace(/\\[a-zA-Z]+/g, (command) => {
      const name = command.slice(1);
      const replacement = LATEX_COMMANDS[name] ?? name;
      return /[a-zA-Z]/.test(replacement) ? ` ${replacement} ` : replacement;
    })
    .replace(/\\./g, (match) => match.slice(1));

  math = replaceMathScript(math, "^", SUPERSCRIPT_CHARS);
  math = replaceMathScript(math, "_", SUBSCRIPT_CHARS);

  return normalizeWhitespace(
    math
      .replace(/[{}$]/g, "")
      .replace(/\s*([+\-*=<>])\s*/g, " $1 ")
      .replace(/<\s+=/g, "<=")
      .replace(/>\s+=/g, ">=")
      .replace(/\s*\/\s*/g, "/")
      .replace(/\s*,\s*/g, ", "),
  );
}

function formatFractionPart(value: string): string {
  const cleaned = cleanMathGroup(value);
  return /[+\-*/=<> ]/.test(cleaned) ? `(${cleaned})` : cleaned;
}

function replaceMathScript(
  input: string,
  marker: "^" | "_",
  alphabet: Record<string, string>,
): string {
  const escapedMarker = marker === "^" ? "\\^" : "_";
  const pattern = new RegExp(`${escapedMarker}(?:\\{([^{}]+)}|([^\\s{}]))`, "g");

  return input.replace(pattern, (_match, group: string, char: string) => {
    const value = group ?? char ?? "";
    const mapped = toScript(value, alphabet);
    return mapped ?? markerText(marker, cleanMathGroup(value));
  });
}

function toScript(
  value: string,
  alphabet: Record<string, string>,
): string | undefined {
  const chars = [...value];
  const mapped = chars.map((char) => alphabet[char]);
  return mapped.every(Boolean) ? mapped.join("") : undefined;
}

function markerText(marker: "^" | "_", value: string): string {
  return marker === "^" ? `^${value}` : `_${value}`;
}

function cleanMathGroup(value: string): string {
  return processInlineMath(value).replace(/^\((.*)\)$/, "$1");
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
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    return namedEntities[lower] ?? match;
  });
}
