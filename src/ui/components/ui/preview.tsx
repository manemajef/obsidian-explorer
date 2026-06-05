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
  const [preview, setPreview] = useState("");

  useEffect(() => {
    void file.loadPreview(maxChar).then((preview) => {
      setPreview(preview ?? "");
    });
  }, [file]);

  return <span className={className}>{preview}</span>;
}
