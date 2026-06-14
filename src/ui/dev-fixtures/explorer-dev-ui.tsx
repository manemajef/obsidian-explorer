import React, { type CSSProperties, type ReactNode } from "react";
import { Divider } from "../components/primitives/layout";

type NamedToken = {
  label: string;
  token: string;
};

const baseBackgroundPairs = [
  {
    label: "primary",
    token: "--background-primary",
    childLabel: "primary alt",
    childToken: "--background-primary-alt",
  },
  {
    label: "secondary",
    token: "--background-secondary",
    childLabel: "secondary alt",
    childToken: "--background-secondary-alt",
  },
] as const;

const backgroundModifiers: readonly NamedToken[] = [
  { label: "hover", token: "--background-modifier-hover" },
  { label: "active hover", token: "--background-modifier-active-hover" },
  { label: "input", token: "--background-modifier-form-field" },
  { label: "message", token: "--background-modifier-message" },
  { label: "interactive", token: "--interactive-normal" },
  { label: "interactive hover", token: "--interactive-hover" },
  { label: "accent", token: "--interactive-accent" },
  { label: "accent hover", token: "--interactive-accent-hover" },
] as const;

const textTokens: readonly NamedToken[] = [
  { label: "normal", token: "--text-normal" },
  { label: "muted", token: "--text-muted" },
  { label: "faint", token: "--text-faint" },
  { label: "accent", token: "--text-accent" },
  { label: "accent hover", token: "--text-accent-hover" },
  { label: "on accent", token: "--text-on-accent" },
  { label: "selection", token: "--text-selection" },
  { label: "highlight", token: "--text-highlight-bg" },
] as const;

const fontSizeTokens = [
  "--font-smallest",
  "--font-smaller",
  "--font-small",
  "--font-ui-smaller",
  "--font-ui-small",
  "--font-ui-medium",
  "--font-ui-large",
] as const;

const fontWeightTokens = [
  "--font-thin",
  "--font-extralight",
  "--font-light",
  "--font-normal",
  "--font-medium",
  "--font-semibold",
  "--font-bold",
  "--font-extrabold",
  "--font-black",
] as const;

const borderTokens: readonly NamedToken[] = [
  { label: "default", token: "--background-modifier-border" },
  { label: "hover", token: "--background-modifier-border-hover" },
  { label: "focus", token: "--background-modifier-border-focus" },
] as const;

const radiusTokens: readonly NamedToken[] = [
  { label: "small", token: "--radius-s" },
  { label: "medium", token: "--radius-m" },
  { label: "large", token: "--radius-l" },
  { label: "extra large", token: "--radius-xl" },
] as const;

const shadowTokens: readonly NamedToken[] = [
  { label: "extra small", token: "--shadow-xs" },
  { label: "small", token: "--shadow-s" },
  { label: "large", token: "--shadow-l" },
  { label: "raised", token: "--raised-shadow" },
] as const;

const raisedTokens: readonly NamedToken[] = [
  { label: "raised background", token: "--raised-background" },
  { label: "raised blur", token: "--raised-blur" },
  { label: "blur background", token: "--blur-background" },
] as const;

const inputTokens: readonly NamedToken[] = [
  { label: "height", token: "--input-height" },
  { label: "padding", token: "--input-padding" },
  { label: "radius", token: "--input-radius" },
  { label: "border", token: "--input-border-width" },
  { label: "focus border", token: "--input-border-width-focus" },
  { label: "placeholder", token: "--input-placeholder-color" },
  { label: "shadow", token: "--input-shadow" },
  { label: "hover shadow", token: "--input-shadow-hover" },
  { label: "search radius", token: "--search-input-radius" },
  { label: "checkbox", token: "--checkbox-size" },
  { label: "toggle width", token: "--toggle-width" },
  { label: "toggle radius", token: "--toggle-radius" },
] as const;

const navTokens: readonly NamedToken[] = [
  { label: "item size", token: "--nav-item-size" },
  { label: "item radius", token: "--nav-item-radius" },
  { label: "item color", token: "--nav-item-color" },
  { label: "hover color", token: "--nav-item-color-hover" },
  { label: "active color", token: "--nav-item-color-active" },
  { label: "hover bg", token: "--nav-item-background-hover" },
  { label: "active bg", token: "--nav-item-background-active" },
  { label: "selected bg", token: "--nav-item-background-selected" },
  { label: "padding", token: "--nav-item-padding" },
  { label: "weight", token: "--nav-item-weight" },
  { label: "heading color", token: "--nav-heading-color" },
  { label: "heading weight", token: "--nav-heading-weight" },
] as const;

const touchTokens: readonly NamedToken[] = [
  { label: "xxs", token: "--touch-size-xxs" },
  { label: "xs", token: "--touch-size-xs" },
  { label: "s", token: "--touch-size-s" },
  { label: "m", token: "--touch-size-m" },
  { label: "l", token: "--touch-size-l" },
  { label: "xl", token: "--touch-size-xl" },
  { label: "xxs radius", token: "--touch-radius-xxs" },
  { label: "xs radius", token: "--touch-radius-xs" },
  { label: "s radius", token: "--touch-radius-s" },
  { label: "m radius", token: "--touch-radius-m" },
  { label: "l radius", token: "--touch-radius-l" },
  { label: "xl radius", token: "--touch-radius-xl" },
] as const;

const tagTokens: readonly NamedToken[] = [
  { label: "size", token: "--tag-size" },
  { label: "color", token: "--tag-color" },
  { label: "background", token: "--tag-background" },
  { label: "hover bg", token: "--tag-background-hover" },
  { label: "border color", token: "--tag-border-color" },
  { label: "border width", token: "--tag-border-width" },
  { label: "padding x", token: "--tag-padding-x" },
  { label: "padding y", token: "--tag-padding-y" },
  { label: "radius", token: "--tag-radius" },
  { label: "pill bg", token: "--pill-background" },
  { label: "pill border", token: "--pill-border-color" },
  { label: "pill radius", token: "--pill-radius" },
] as const;

const toolbarButtons = [
  { label: "^", name: "Go to parent" },
  { label: "?", name: "Search" },
  { label: "+", name: "Create note" },
] as const;

function cssVar(token: string): string {
  return `var(${token})`;
}

function Columns({
  children,
  columns = 3,
  gap = "var(--size-4-3)",
  min = "12rem",
}: {
  children: ReactNode;
  columns?: number;
  gap?: CSSProperties["gap"];
  min?: string;
}): React.JSX.Element {
  return (
    <div
      style={{
        display: "grid",
        gap,
        gridTemplateColumns: `repeat(${columns}, minmax(min(${min}, 100%), 1fr))`,
      }}
    >
      {children}
    </div>
  );
}

function Section({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}): React.JSX.Element {
  return (
    <section style={{ display: "grid", gap: "var(--size-4-3)" }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      {children}
    </section>
  );
}

function TokenName({ children }: { children: string }): React.JSX.Element {
  return (
    <code
      style={{
        color: "var(--text-muted)",
        fontSize: "var(--font-ui-smaller)",
        overflowWrap: "anywhere",
      }}
    >
      {children}
    </code>
  );
}

function Swatch({
  label,
  style,
}: {
  label: string;
  style: CSSProperties;
}): React.JSX.Element {
  return (
    <div
      style={{
        borderRadius: "var(--radius-m)",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          minHeight: "4.5rem",
          padding: "var(--size-4-3)",
          ...style,
        }}
      >
        <strong style={{ fontSize: "var(--font-ui-small)" }}>{label}</strong>
      </div>
    </div>
  );
}

function SampleCell({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        minHeight: "6rem",
        minWidth: 0,
        padding: "var(--size-4-2)",
      }}
    >
      {children}
    </div>
  );
}

function SampleBox({
  label,
  style,
}: {
  label: string;
  style?: CSSProperties;
}): React.JSX.Element {
  return (
    <div
      style={{
        background: "var(--background-primary)",
        border: "var(--border-width) solid var(--background-modifier-border)",
        borderRadius: "var(--radius-m)",
        minHeight: "4.5rem",
        padding: "var(--size-4-3)",
        width: "100%",
        ...style,
      }}
    >
      <strong style={{ fontSize: "var(--font-ui-small)" }}>{label}</strong>
    </div>
  );
}

function TokenGrid({
  kind,
  tokens,
}: {
  kind: "background" | "border" | "color" | "shadow";
  tokens: readonly NamedToken[];
}): React.JSX.Element {
  return (
    <Columns columns={4} min="10rem">
      {tokens.map((item) => {
        const value = cssVar(item.token);
        const styleByKind: Record<typeof kind, CSSProperties> = {
          background: {
            background: value,
            color: "var(--text-normal)",
          },
          border: {
            background: "var(--background-primary)",
            borderColor: value,
            borderStyle: "solid",
            borderWidth: "4px",
          },
          color: {
            background: "var(--background-primary)",
            color: value,
          },
          shadow: {
            background: "var(--background-primary)",
            boxShadow: value,
          },
        };

        if (kind === "background") {
          return (
            <Swatch
              key={item.token}
              label={item.label}
              style={styleByKind[kind]}
            />
          );
        }

        return (
          <SampleCell key={item.token}>
            <SampleBox label={item.label} style={styleByKind[kind]} />
          </SampleCell>
        );
      })}
    </Columns>
  );
}

function Typography(): React.JSX.Element {
  return (
    <Section title="Typography">
      <Columns columns={2} min="16rem">
        <div>
          <h3>Font sizes</h3>
          {fontSizeTokens.map((token) => (
            <p key={token} style={{ fontSize: cssVar(token), margin: "0.5em 0" }}>
              <TokenName>{token}</TokenName> Explorer sample text for sizing
              across themes.
            </p>
          ))}
        </div>
        <div>
          <h3>Font weights</h3>
          {fontWeightTokens.map((token) => (
            <p
              key={token}
              style={{ fontWeight: cssVar(token), margin: "0.5em 0" }}
            >
              <TokenName>{token}</TokenName> Explorer hierarchy sample
            </p>
          ))}
        </div>
      </Columns>
      <Columns columns={2} min="16rem">
        <div>
          <h3>Normal line height</h3>
          <p style={{ lineHeight: "var(--line-height-normal)", margin: 0 }}>
            <TokenName>--line-height-normal</TokenName> Aliquip elit labore
            officia anim pariatur ex voluptate enim ipsum reprehenderit non
            tempor sit.
          </p>
        </div>
        <div>
          <h3>Tight line height</h3>
          <p style={{ lineHeight: "var(--line-height-tight)", margin: 0 }}>
            <TokenName>--line-height-tight</TokenName> Aliquip elit labore
            officia anim pariatur ex voluptate enim ipsum reprehenderit non
            tempor sit.
          </p>
        </div>
      </Columns>
    </Section>
  );
}

function Colors(): React.JSX.Element {
  return (
    <Section title="Colors and backgrounds">
      <div>
        <h3>Base backgrounds</h3>
        <Columns columns={2} min="16rem">
          {baseBackgroundPairs.map((pair) => (
            <div
              key={pair.token}
              style={{
                background: cssVar(pair.token),
                border: "var(--border-width) solid var(--background-modifier-border)",
                borderRadius: "var(--radius-l)",
                padding: "var(--size-4-4)",
              }}
            >
              <strong>{pair.label}</strong>
              <div
                style={{
                  background: cssVar(pair.childToken),
                  borderRadius: "var(--radius-m)",
                  marginBlockStart: "var(--size-4-3)",
                  padding: "var(--size-4-3)",
                }}
              >
                {pair.childLabel}
              </div>
            </div>
          ))}
        </Columns>
      </div>
      <div>
        <h3>Interaction backgrounds</h3>
        <TokenGrid kind="background" tokens={backgroundModifiers} />
      </div>
      <div>
        <h3>Text colors</h3>
        <Columns columns={4} min="10rem">
          {textTokens.map((item) => (
            <p
              key={item.token}
              style={{
                color: cssVar(item.token),
                fontSize: "var(--font-ui-medium)",
                margin: 0,
              }}
            >
              {item.label}
            </p>
          ))}
        </Columns>
      </div>
    </Section>
  );
}

function Surfaces(): React.JSX.Element {
  return (
    <Section title="Borders, radius, elevation, and blur">
      <div>
        <h3>Radius</h3>
        <Columns columns={4} min="10rem">
          {radiusTokens.map((item) => (
            <SampleCell key={item.token}>
              <SampleBox
                label={item.label}
                style={{
                  background: "var(--background-secondary)",
                  borderRadius: cssVar(item.token),
                }}
              />
            </SampleCell>
          ))}
        </Columns>
      </div>
      <div>
        <h3>Borders</h3>
        <TokenGrid kind="border" tokens={borderTokens} />
      </div>
      <div>
        <h3>Shadows</h3>
        <TokenGrid kind="shadow" tokens={shadowTokens} />
      </div>
      <div>
        <h3>Raised and blur</h3>
        <Columns columns={3} min="14rem">
          {raisedTokens.map((item) => (
            <Swatch
              key={item.token}
              label={item.label}
              style={{
                backdropFilter: item.token.includes("blur")
                  ? cssVar(item.token)
                  : undefined,
                background: cssVar(item.token),
                boxShadow: "var(--raised-shadow)",
              }}
            />
          ))}
        </Columns>
      </div>
    </Section>
  );
}

function InputSample({ item }: { item: NamedToken }): React.JSX.Element {
  if (item.token === "--checkbox-size") {
    return (
      <SampleCell>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: "var(--size-4-2)",
          }}
        >
          <span
            style={{
              border: "var(--border-width) solid var(--checkbox-border-color)",
              borderRadius: "var(--checkbox-radius)",
              height: cssVar(item.token),
              width: cssVar(item.token),
            }}
          />
          <strong style={{ fontSize: "var(--font-ui-small)" }}>{item.label}</strong>
        </div>
      </SampleCell>
    );
  }

  if (item.token.includes("toggle")) {
    return (
      <SampleCell>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: "var(--size-4-2)",
          }}
        >
          <span
            style={{
              alignItems: "center",
              background: "var(--interactive-accent)",
              borderRadius: item.token.includes("radius")
                ? cssVar(item.token)
                : "var(--toggle-radius)",
              display: "flex",
              height: "var(--toggle-radius)",
              padding: "var(--toggle-border-width)",
              width: item.token.includes("width")
                ? cssVar(item.token)
                : "var(--toggle-width)",
            }}
          >
            <span
              style={{
                background: "var(--toggle-thumb-color)",
                borderRadius: "var(--toggle-thumb-radius)",
                height: "var(--toggle-thumb-height)",
                marginInlineStart: "auto",
                width: "var(--toggle-thumb-width)",
              }}
            />
          </span>
          <strong style={{ fontSize: "var(--font-ui-small)" }}>{item.label}</strong>
        </div>
      </SampleCell>
    );
  }

  return (
    <SampleCell>
      <div
        style={{
          alignItems: "center",
          background: "var(--background-modifier-form-field)",
          border: "var(--input-border-width) solid var(--background-modifier-border)",
          borderColor: item.token.includes("focus")
            ? "var(--background-modifier-border-focus)"
            : "var(--background-modifier-border)",
          borderRadius: item.token.includes("radius")
            ? cssVar(item.token)
            : "var(--input-radius)",
          borderWidth: item.token.includes("border") ? cssVar(item.token) : undefined,
          boxShadow: item.token.includes("shadow") ? cssVar(item.token) : undefined,
          color: item.token.includes("placeholder")
            ? cssVar(item.token)
            : "var(--text-normal)",
          display: "flex",
          minHeight: item.token.includes("height")
            ? cssVar(item.token)
            : "var(--input-height)",
          padding: item.token.includes("padding")
            ? cssVar(item.token)
            : "var(--input-padding)",
          width: "100%",
        }}
      >
        {item.token.includes("padding") ? (
          <span
            style={{
              background: "var(--background-modifier-hover)",
              borderRadius: "var(--radius-s)",
              padding: "var(--size-2-2)",
            }}
          >
            {item.label}
          </span>
        ) : (
          <strong style={{ fontSize: "var(--font-ui-small)" }}>{item.label}</strong>
        )}
      </div>
    </SampleCell>
  );
}

function NavSample({ item }: { item: NamedToken }): React.JSX.Element {
  return (
    <SampleCell>
      <div
        style={{
          alignItems: "center",
          background: item.token.includes("background")
            ? cssVar(item.token)
            : "var(--background-primary)",
          borderRadius: item.token.includes("radius")
            ? cssVar(item.token)
            : "var(--nav-item-radius)",
          color: item.token.includes("color")
            ? cssVar(item.token)
            : "var(--nav-item-color)",
          display: "flex",
          fontSize: item.token.includes("size")
            ? cssVar(item.token)
            : "var(--nav-item-size)",
          fontWeight: item.token.includes("weight")
            ? cssVar(item.token)
            : "var(--nav-item-weight)",
          gap: "var(--size-4-2)",
          padding: item.token.includes("padding")
            ? cssVar(item.token)
            : "var(--nav-item-padding)",
          width: "100%",
        }}
      >
        <span>{">"}</span>
        <span>{item.label}</span>
        <span style={{ color: "var(--text-faint)", marginInlineStart: "auto" }}>
          12
        </span>
      </div>
    </SampleCell>
  );
}

function TagSample({ item }: { item: NamedToken }): React.JSX.Element {
  const isPill = item.token.includes("pill");

  return (
    <SampleCell>
      <span
        style={{
          background: item.token.includes("background")
            ? cssVar(item.token)
            : isPill
              ? "var(--pill-background)"
              : "var(--tag-background)",
          borderColor: item.token.includes("border")
            ? cssVar(item.token)
            : isPill
              ? "var(--pill-border-color)"
              : "var(--tag-border-color)",
          borderRadius: item.token.includes("radius")
            ? cssVar(item.token)
            : isPill
              ? "var(--pill-radius)"
              : "var(--tag-radius)",
          borderStyle: "solid",
          borderWidth: item.token.includes("border-width")
            ? cssVar(item.token)
            : isPill
              ? "var(--pill-border-width)"
              : "var(--tag-border-width)",
          color: item.token.includes("color") ? cssVar(item.token) : "var(--tag-color)",
          fontSize: item.token.includes("size") ? cssVar(item.token) : "var(--tag-size)",
          paddingBlock: item.token.includes("padding-y")
            ? cssVar(item.token)
            : isPill
              ? "var(--pill-padding-y)"
              : "var(--tag-padding-y)",
          paddingInline: item.token.includes("padding-x")
            ? cssVar(item.token)
            : isPill
              ? "var(--pill-padding-x)"
              : "var(--tag-padding-x)",
        }}
      >
        {item.label}
      </span>
    </SampleCell>
  );
}

function Controls(): React.JSX.Element {
  return (
    <Section title="Controls, navigation, tags, and touch">
      <div>
        <h3>Inputs</h3>
        <Columns columns={4} min="11rem">
          {inputTokens.map((item) => (
            <InputSample key={item.token} item={item} />
          ))}
        </Columns>
      </div>
      <div>
        <h3>Navigation</h3>
        <Columns columns={4} min="11rem">
          {navTokens.map((item) => (
            <NavSample key={item.token} item={item} />
          ))}
        </Columns>
      </div>
      <div>
        <h3>Tags and pills</h3>
        <Columns columns={4} min="10rem">
          {tagTokens.map((item) => (
            <TagSample key={item.token} item={item} />
          ))}
        </Columns>
      </div>
      <div>
        <h3>Touch targets</h3>
        <Columns columns={6} min="7rem">
          {touchTokens.map((item) => (
            <div
              key={item.token}
              style={{
                alignItems: "center",
                display: "flex",
                justifyContent: "center",
                minHeight: "6rem",
                padding: "var(--size-4-2)",
              }}
            >
              <div
                style={{
                  alignItems: "center",
                  background: "var(--interactive-normal)",
                  borderRadius: item.token.includes("radius")
                    ? cssVar(item.token)
                    : "50%",
                  display: "flex",
                  height: item.token.includes("size")
                    ? cssVar(item.token)
                    : "var(--touch-size-m)",
                  justifyContent: "center",
                  width: item.token.includes("size")
                    ? cssVar(item.token)
                    : "var(--touch-size-m)",
                }}
              >
                <strong style={{ fontSize: "var(--font-ui-smaller)" }}>
                  {item.label}
                </strong>
              </div>
            </div>
          ))}
        </Columns>
      </div>
    </Section>
  );
}

function RecipeParts({
  parts,
}: {
  parts: readonly string[];
}): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--size-2-2)",
      }}
    >
      {parts.map((part) => (
        <code
          key={part}
          style={{
            background: "var(--background-primary-alt)",
            border: "var(--border-width) solid var(--background-modifier-border)",
            borderRadius: "var(--radius-s)",
            color: "var(--text-muted)",
            fontSize: "var(--font-ui-smaller)",
            padding: "var(--size-2-1) var(--size-2-2)",
          }}
        >
          {part}
        </code>
      ))}
    </div>
  );
}

function NoteCardRecipe(): React.JSX.Element {
  const parts = [
    "background: raised",
    "shadow: raised",
    "radius: large",
    "border: default",
    "title: UI medium / semibold",
    "description: UI smaller / muted",
  ] as const;

  return (
    <div
      style={{
        background: "var(--raised-background)",
        border: "var(--border-width) solid var(--background-modifier-border)",
        borderRadius: "var(--radius-l)",
        boxShadow: "var(--raised-shadow)",
        padding: "var(--size-4-4)",
      }}
    >
      <p
        style={{
          fontSize: "var(--font-ui-medium)",
          fontWeight: "var(--font-semibold)",
          lineHeight: "var(--line-height-tight)",
          margin: 0,
        }}
      >
        Weekly planning note
      </p>
      <p
        style={{
          color: "var(--text-muted)",
          fontSize: "var(--font-ui-smaller)",
          lineHeight: "var(--line-height-normal)",
          margin: "var(--size-4-2) 0 var(--size-4-3)",
        }}
      >
        Raised surface, compact title, muted description, and theme-owned
        elevation.
      </p>
      <RecipeParts parts={parts} />
    </div>
  );
}

function FolderRowRecipe(): React.JSX.Element {
  const parts = [
    "background: nav hover",
    "radius: nav item",
    "padding: nav item",
    "text: nav item",
    "icon: collapse",
  ] as const;

  return (
    <div
      style={{
        background: "var(--nav-item-background-hover)",
        borderRadius: "var(--nav-item-radius)",
        color: "var(--nav-item-color)",
        fontSize: "var(--nav-item-size)",
        padding: "var(--nav-item-padding)",
      }}
    >
      <div style={{ display: "flex", gap: "var(--size-4-2)" }}>
        <span style={{ color: "var(--collapse-icon-color)" }}>{">"}</span>
        <strong style={{ fontWeight: "var(--nav-item-weight)" }}>Projects</strong>
        <span style={{ color: "var(--text-faint)", marginInlineStart: "auto" }}>
          18
        </span>
      </div>
      <div style={{ marginBlockStart: "var(--size-4-2)" }}>
        <RecipeParts parts={parts} />
      </div>
    </div>
  );
}

function FloatingToolbarRecipe(): React.JSX.Element {
  const parts = [
    "background: raised",
    "blur: raised",
    "shadow: extra small",
    "radius: extra large",
    "icons: default size/color",
    "buttons: hover background",
  ] as const;

  return (
    <div
      style={{
        alignItems: "center",
        backdropFilter: "var(--raised-blur)",
        background: "var(--raised-background)",
        border: "var(--border-width) solid var(--background-modifier-border)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-xs)",
        display: "flex",
        gap: "var(--size-4-1)",
        padding: "var(--size-4-1)",
      }}
    >
      {toolbarButtons.map((button) => (
        <button
          aria-label={button.name}
          key={button.name}
          style={{
            alignItems: "center",
            background: "var(--background-modifier-hover)",
            border: 0,
            borderRadius: "var(--radius-l)",
            color: "var(--icon-color)",
            display: "flex",
            fontSize: "var(--icon-size)",
            height: "var(--touch-size-s)",
            justifyContent: "center",
            width: "var(--touch-size-s)",
          }}
          type="button"
        >
          {button.label}
        </button>
      ))}
      <div style={{ flexBasis: "100%", height: 0 }} />
      <RecipeParts parts={parts} />
    </div>
  );
}

function InputPanelRecipe(): React.JSX.Element {
  const parts = [
    "panel: primary alt",
    "field: form background",
    "radius: input",
    "shadow: input",
    "height/padding: input",
    "label: UI small / muted",
  ] as const;

  return (
    <div
      style={{
        background: "var(--background-primary-alt)",
        border: "var(--border-width) solid var(--background-modifier-border)",
        borderRadius: "var(--radius-l)",
        padding: "var(--size-4-4)",
      }}
    >
      <label
        style={{
          color: "var(--text-muted)",
          display: "grid",
          fontSize: "var(--font-ui-small)",
          gap: "var(--size-4-2)",
        }}
      >
        Filter notes
        <div
          style={{
            alignItems: "center",
            background: "var(--background-modifier-form-field)",
            borderRadius: "var(--input-radius)",
            boxShadow: "var(--input-shadow)",
            color: "var(--input-placeholder-color)",
            display: "flex",
            minHeight: "var(--input-height)",
            padding: "var(--input-padding)",
          }}
        >
          Search by title or folder
        </div>
      </label>
      <div style={{ marginBlockStart: "var(--size-4-3)" }}>
        <RecipeParts parts={parts} />
      </div>
    </div>
  );
}

function ComponentRecipes(): React.JSX.Element {
  return (
    <Section title="Variables combined into components">
      <Columns columns={2} min="18rem">
        <NoteCardRecipe />
        <FolderRowRecipe />
        <FloatingToolbarRecipe />
        <InputPanelRecipe />
      </Columns>
    </Section>
  );
}

export function ExplorerDevUI(): React.JSX.Element {
  return (
    <>
      <Divider />
      <Typography />
      <Divider />
      <Colors />
      <Divider />
      <Surfaces />
      <Divider />
      <Controls />
      <Divider />
      <ComponentRecipes />
      <Divider />
    </>
  );
}
