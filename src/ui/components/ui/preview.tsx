import { ExplorerFileNode } from "src/explorer/lib/nodes";
import React from "react";
const { useEffect, useState } = React;

export function Preview({
  file,
  className,
}: {
  file: ExplorerFileNode;
  className?: string;
}) {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    void file.loadPreview().then((preview) => {
      setPreview(preview ?? "");
    });
  }, [file]);

  return <span className={className}>{preview}</span>;
}
