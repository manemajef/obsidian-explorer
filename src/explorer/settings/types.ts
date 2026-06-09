export type SettingsSurface = "plugin" | "block";

import type { BlockSettingsGroup, SettingsSection } from "./schema";

type SettingVisibility = {
  key?: string;
  value?: unknown;
  platform?: "mobile" | "desktop";
};

export type SettingUiMeta = {
  surfaces: readonly SettingsSurface[];
  section: SettingsSection;
  group?: BlockSettingsGroup;
  visibleWhen?: SettingVisibility;
};

export type LegacySettingAlias<T> = {
  blockKeys: readonly string[];
  resolve: (source: Record<string, unknown>) => T | undefined;
};

export type DeclarativeLegacySetting<T> = {
  predecessor?: string;
  valueMap?: Record<string, T>;
  preserveOldDefault?: boolean;
  oldDefault?: T;
};

type BaseSettingField<T> = {
  label: string;
  description?: string;
  defaultValue: T;
  ui: SettingUiMeta;
  legacy?: DeclarativeLegacySetting<unknown> | LegacySettingAlias<unknown>;
};

export type EnumSettingField<T extends string> = BaseSettingField<T> & {
  kind: "enum";
  options: readonly T[];
  optionLabels?: Partial<Record<T, string>>;
};

export type NumberSettingField = BaseSettingField<number> & {
  kind: "number";
  min: number;
  max: number;
  step?: number;
};

export type BooleanSettingField = BaseSettingField<boolean> & {
  kind: "boolean";
};

export type TextSettingField = BaseSettingField<string> & {
  kind: "text";
  placeholder?: (vaultName: string) => string;
};

export type FolderPickerSettingField = BaseSettingField<string[]> & {
  kind: "folder-picker";
  placeholder?: string;
};

export type SettingField<T> =
  | EnumSettingField<Extract<T, string>>
  | NumberSettingField
  | BooleanSettingField
  | TextSettingField
  | FolderPickerSettingField;

export type AnySettingField =
  | EnumSettingField<string>
  | NumberSettingField
  | BooleanSettingField
  | TextSettingField
  | FolderPickerSettingField;

export type BlockField = (
  | EnumSettingField<string>
  | NumberSettingField
  | BooleanSettingField
  | FolderPickerSettingField
) & {
  blockKey: string;
  legacy?: DeclarativeLegacySetting<unknown> | LegacySettingAlias<unknown>;
};

export const enumField = <
  T extends string,
  F extends Omit<EnumSettingField<T>, "kind">,
>(
  field: F,
): F & { kind: "enum" } => ({
  kind: "enum",
  ...field,
});

export const numberField = <F extends Omit<NumberSettingField, "kind">>(
  field: F,
): F & { kind: "number" } => ({
  kind: "number",
  ...field,
});

export const booleanField = <F extends Omit<BooleanSettingField, "kind">>(
  field: F,
): F & { kind: "boolean" } => ({
  kind: "boolean",
  ...field,
});

export const textField = <F extends Omit<TextSettingField, "kind">>(
  field: F,
): F & { kind: "text" } => ({
  kind: "text",
  ...field,
});

export const folderPickerField = <
  F extends Omit<FolderPickerSettingField, "kind">,
>(
  field: F,
): F & { kind: "folder-picker" } => ({
  kind: "folder-picker",
  ...field,
});

type DefinedBlockSchema<T extends Record<string, BlockField>> = {
  [K in keyof T]: T[K] & {
    description?: string;
    legacy?: DeclarativeLegacySetting<unknown> | LegacySettingAlias<unknown>;
    ui: SettingUiMeta;
  };
};

type DefinedPluginSchema<T extends Record<string, AnySettingField>> = {
  [K in keyof T]: T[K] & { ui: SettingUiMeta };
};

export function defineBlockSchema<T extends Record<string, BlockField>>(
  schema: T,
): DefinedBlockSchema<T> {
  return schema as DefinedBlockSchema<T>;
}

export function definePluginSchema<T extends Record<string, AnySettingField>>(
  schema: T,
): DefinedPluginSchema<T> {
  return schema as DefinedPluginSchema<T>;
}
