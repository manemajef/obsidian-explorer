import type { BlockField } from "./types";
import type {
  BlockSettingKey,
  DisplayedNotes,
  PaginationStyle,
  PluginSettingKey,
} from "./schema";

type LegacySetting = NonNullable<BlockField["legacy"]>;
type FieldWithLegacy = { legacy?: LegacySetting };

function hasOwn(source: Record<string, unknown>, key: string): boolean {
  return key in source;
}

function coerceLegacyBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function getLegacyValueMapKey(value: unknown): string {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return "";
}

function coerceLegacyValue(
  value: unknown,
  legacy: LegacySetting,
): unknown {
  if ("valueMap" in legacy && legacy.valueMap && value !== undefined) {
    const mappedValue = legacy.valueMap[getLegacyValueMapKey(value)];
    if (mappedValue !== undefined) return mappedValue;
  }

  if ("coerce" in legacy && legacy.coerce === "nonzero-number") {
    if (
      typeof value !== "number" &&
      typeof value !== "string" &&
      typeof value !== "boolean"
    ) {
      return undefined;
    }
    const numeric = Number(value);
    return Number.isNaN(numeric) ? undefined : numeric !== 0;
  }

  return value;
}

export function resolveLegacySettingValue(
  legacy: LegacySetting,
  source: Record<string, unknown>,
): unknown {
  if ("resolve" in legacy && legacy.resolve) {
    return legacy.resolve(source);
  }

  if ("blockKeys" in legacy) {
    for (const blockKey of legacy.blockKeys) {
      if (blockKey in source) {
        return coerceLegacyValue(source[blockKey], legacy);
      }
    }
    return undefined;
  }

  if ("predecessor" in legacy && legacy.predecessor) {
    const predecessor = legacy.predecessor;
    if (predecessor in source) {
      return coerceLegacyValue(source[predecessor], legacy);
    }
  }

  return undefined;
}

export function applyLegacySettingAliases(
  keys: readonly BlockSettingKey[],
  schema: Record<BlockSettingKey, BlockField>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const normalized = { ...source };

  for (const key of keys) {
    if (key in source) continue;

    const legacy = schema[key].legacy;
    if (!legacy) continue;

    const legacyValue = resolveLegacySettingValue(legacy, source);
    if (legacyValue !== undefined) {
      normalized[key] = legacyValue;
    }
  }

  return normalized;
}

export function resolveLegacyPluginSetting(
  key: PluginSettingKey,
  raw: Record<string, unknown>,
  rawBlockDefaults: Record<string, unknown>,
  field: FieldWithLegacy,
): { hasValue: boolean; value: unknown } {
  if (key in raw) {
    return { hasValue: true, value: raw[key] };
  }

  if (key in rawBlockDefaults) {
    return { hasValue: true, value: rawBlockDefaults[key] };
  }

  if (field.legacy) {
    const value = resolveLegacySettingValue(field.legacy, raw);
    if (value !== undefined) return { hasValue: true, value };
  }

  return { hasValue: false, value: undefined };
}

export function getLegacyFallback<T>(field: FieldWithLegacy, fallback: T): T {
  const legacy = field.legacy;
  if (legacy && "oldDefault" in legacy && legacy.oldDefault !== undefined) {
    return legacy.oldDefault as T;
  }
  return fallback;
}

export function resolveLegacyAdaptToMobile(
  source: Record<string, unknown>,
): boolean | undefined {
  return coerceLegacyBoolean(source.alwaysUseModernListInMobile);
}

export function resolveLegacyPaginationStyle(
  source: Record<string, unknown>,
): PaginationStyle | undefined {
  const usePagination = coerceLegacyBoolean(source.usePagination);
  if (usePagination === false) return "none";
  if (!hasOwn(source, "paginationStyle") && usePagination === true) {
    return "modern";
  }
  return undefined;
}

export function resolveLegacyDisplayedNotes(
  source: Record<string, unknown>,
): DisplayedNotes | undefined {
  if (hasOwn(source, "displayedNotes")) return undefined;

  const showNotes = coerceLegacyBoolean(source.showNotes);
  const onlyNotes = coerceLegacyBoolean(source.onlyNotes);
  const showUnsupportedFiles = coerceLegacyBoolean(source.showUnsupportedFiles);

  if (showNotes === false) return "none";
  if (onlyNotes === true) return "markdown";
  if (showUnsupportedFiles === true) return "all";
  if (
    hasOwn(source, "showNotes") ||
    hasOwn(source, "onlyNotes") ||
    hasOwn(source, "showUnsupportedFiles")
  ) {
    return "supported";
  }
  return undefined;
}

export function resolveLegacyDisableGlassToolbar(
  source: Record<string, unknown>,
): boolean | undefined {
  const compactActionBar = coerceLegacyBoolean(source.compactActionBar);
  if (compactActionBar !== undefined) return compactActionBar;

  const useGlass = coerceLegacyBoolean(source.useGlass);
  return useGlass === undefined ? undefined : !useGlass;
}
