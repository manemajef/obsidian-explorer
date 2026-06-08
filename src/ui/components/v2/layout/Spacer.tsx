import React from "react";

type SpacerProps = {
  size?: "xs" | "sm" | "md" | "lg";
  grow?: boolean;
};

export function Spacer({
  size = "sm",
  grow = false,
}: SpacerProps): React.JSX.Element {
  return <span className="ex-spacer" data-grow={grow || undefined} data-size={size} />;
}
