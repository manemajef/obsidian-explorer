import { ExplorerFileNode } from "src/explorer/lib/nodes";
import React from "react";
const { useEffect, useState } = React;

type NotePreviewState = {
  isLoading: boolean;
  preview: string;
  hasPreview: boolean;
};

export function useNotePreview(
  file: ExplorerFileNode,
  { maxChar }: { maxChar?: number } = {},
): NotePreviewState {
  const effectiveMaxChar = maxChar ?? 100;
  const [state, setState] = useState<NotePreviewState>({
    isLoading: true,
    preview: "",
    hasPreview: false,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ isLoading: true, preview: "", hasPreview: false });

    void file.loadPreview(effectiveMaxChar).then((preview) => {
      if (cancelled) return;

      const text = preview?.trim() ?? "";
      setState({
        isLoading: false,
        preview: text,
        hasPreview: text.length > 0,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [file, effectiveMaxChar]);

  return state;
}

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
  const { isLoading, preview, hasPreview } = useNotePreview(file, {
    maxChar: effectiveMaxChar,
  });
  const placeholder = "W".repeat(effectiveMaxChar);

  if (isLoading)
    return <span className="explorer-preview-placeholder">{placeholder}</span>;

  if (!hasPreview) return null;

  return <span className={className}>{preview}</span>;
}
