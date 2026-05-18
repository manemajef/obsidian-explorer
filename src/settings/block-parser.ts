import {
  BLOCK_SETTING_KEYS,
  BLOCK_SETTINGS_SCHEMA,
  BlockSettingKey,
  BlockSettings,
  DEFAULT_BLOCK_SETTINGS,
  coercePartialBlockSettings,
  getBlockSettingsOverrides,
  getSettingKeyForBlockKey,
  isLegacySettingBlockKey,
} from "./schema";

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

function parseScalar(rawValue: string): string | boolean {
  if (rawValue === "true") return true;
  if (rawValue === "false") return false;
  return rawValue;
}

/**
 * Parse per-block settings from explorer code block source text.
 */
export function parseSettings(source: string): Partial<BlockSettings> {
  const overrides: Record<string, unknown> = {};
  const lines = source.trim().split("\n");

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*["']?([^"'\n]+)["']?$/);
    if (!match) continue;

    const [, blockKey, value] = match;
    const settingKey = getSettingKeyForBlockKey(blockKey);
    if (settingKey) {
      overrides[settingKey] = parseScalar(value.trim());
    } else if (isLegacySettingBlockKey(blockKey)) {
      overrides[blockKey] = parseScalar(value.trim());
    }
  }

  return coercePartialBlockSettings(overrides);
}

/**
 * Serialize settings into block syntax, emitting only values that differ from defaults.
 */
export function serializeSettings(
  settings: BlockSettings,
  defaultSettings: BlockSettings = DEFAULT_BLOCK_SETTINGS,
): string {
  const lines: string[] = [];
  const overrides = getBlockSettingsOverrides(settings, defaultSettings);

  for (const key of BLOCK_SETTING_KEYS) {
    if (!(key in overrides)) continue;
    const blockKey = BLOCK_SETTINGS_SCHEMA[key].blockKey;
    lines.push(`${blockKey}: ${formatValue(key, settings[key])}`);
  }

  return lines.join("\n");
}
