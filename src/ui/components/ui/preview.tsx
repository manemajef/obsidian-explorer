import { ExplorerFileNode } from "src/explorer/lib/nodes";
import React from "react";
const { useEffect, useState } = React;

export function Preview({
  file,
  className,
  maxChar,
}: {
  file: ExplorerFileNode;
  className?: string;
  maxChar?: number;
}) {
  const effectiveMaxChar = maxChar ?? 100;
  const [done, setDone] = useState(false);
  const [preview, setPreview] = useState("");
  const placeholder = "W".repeat(effectiveMaxChar);

  useEffect(() => {
    void file.loadPreview(effectiveMaxChar).then((preview) => {
      setPreview(preview ?? "");
      setDone(true);
    });
  }, [file]);
  if (!done)
    return <span style={{ color: "rgba(0,0,0,0)" }}>{placeholder}</span>;

  return <span className={className}>{preview}</span>;
}
