import React from "react";
import { Divider } from "../components/primitives/layout";

const themeColorTokens = [
  "var(--background-primary-alt)",
  "var(--interactive-normal)",
  "var(--menu-background)",
  "var(--setting-items-background)",
  "var(--setting-items-border-color)",
  "var(--background-modifier-message)",
  "var(--settings-home-background)",
  "var(--menu-divider-color)",
  "var(--mobile-sidebar-background)",
  "var(--modal-background)",
  "var(--interactive-hover)",
  "var(--background-modifier-cover)",
  "var(--background-modifier-form-field)",
  "var(--search-result-background)",
  "var(--interactive-accent)",
  "var(--background-secondary)",
] as const;

export function ExplorerDevUI(): React.JSX.Element {
  return (
    <>
      <Divider />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "0.5em",
        }}
      >
        {themeColorTokens.map((token) => (
          <div
            key={token}
            style={{
              background: token,
              color: "var(--text-normal)",
              minWidth: 0,
              overflowWrap: "anywhere",
              padding: "1em",
            }}
          >
            {token}
          </div>
        ))}
      </div>
      <Divider />
    </>
  );
}
