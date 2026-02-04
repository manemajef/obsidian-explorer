import {
  BLOCK_SETTING_KEYS,
  BLOCK_SETTINGS_SCHEMA,
  BlockSettingKey,
  BlockSettings,
  DEFAULT_BLOCK_SETTINGS,
} from "../../settings/schema";

const BLOCK_KEY_TO_SETTING_KEY: Record<string, BlockSettingKey> =
  BLOCK_SETTING_KEYS.reduce(
    (acc, key) => {
      acc[BLOCK_SETTINGS_SCHEMA[key].blockKey] = key;
      return acc;
    },
    {} as Record<string, BlockSettingKey>,
  );

function parseValue<K extends BlockSettingKey>(
  key: K,
  rawValue: string,
): BlockSettings[K] | undefined {
  const field = BLOCK_SETTINGS_SCHEMA[key];

  if (field.kind === "boolean") {
    if (rawValue === "true") return true as BlockSettings[K];
    if (rawValue === "false") return false as BlockSettings[K];
    return undefined;
  }

  if (field.kind === "number") {
    const parsed = Number.parseInt(rawValue, 10);
    if (Number.isNaN(parsed) || parsed < field.min || parsed > field.max) {
      return undefined;
    }
    return parsed as BlockSettings[K];
  }

  if (field.options.includes(rawValue as never)) {
    return rawValue as BlockSettings[K];
  }

  return undefined;
}

function setOverride<K extends BlockSettingKey>(
  target: Partial<BlockSettings>,
  key: K,
  value: BlockSettings[K],
): void {
  target[key] = value;
}

function formatValue<K extends BlockSettingKey>(
  key: K,
  value: BlockSettings[K],
): string {
  const field = BLOCK_SETTINGS_SCHEMA[key];
  if (field.kind === "enum") {
    return `"${String(value)}"`;
  }
  return String(value);
}

/**
 * Parse per-block settings from explorer code block source text.
 */
export function parseSettings(source: string): Partial<BlockSettings> {
  const overrides: Partial<BlockSettings> = {};
  const lines = source.trim().split("\n");

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*["']?([^"'\n]+)["']?$/);
    if (!match) continue;

    const [, blockKey, value] = match;
    const settingKey = BLOCK_KEY_TO_SETTING_KEY[blockKey];
    if (!settingKey) continue;

    const parsed = parseValue(settingKey, value.trim());
    if (parsed !== undefined) {
      setOverride(overrides, settingKey, parsed);
    }
  }

  return overrides;
}

/**
 * Serialize settings into block syntax, emitting only values that differ from defaults.
 */
export function serializeSettings(
  settings: BlockSettings,
  defaultSettings: BlockSettings = DEFAULT_BLOCK_SETTINGS,
): string {
  const lines: string[] = [];

  for (const key of BLOCK_SETTING_KEYS) {
    if (settings[key] === defaultSettings[key]) {
      continue;
    }

    const blockKey = BLOCK_SETTINGS_SCHEMA[key].blockKey;
    lines.push(`${blockKey}: ${formatValue(key, settings[key])}`);
  }

  return lines.join("\n");
}
