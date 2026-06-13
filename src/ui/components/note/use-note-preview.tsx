import { ExplorerFileNode } from "src/explorer/lib/nodes";
import React from "react";
const { useEffect, useState, useRef } = React;

type NotePreviewState = {
  isLoading: boolean;
  preview: string;
  hasPreview: boolean;
};

export function useNotePreview(
  file: ExplorerFileNode,
  { maxChar, enabled = true }: { maxChar?: number; enabled?: boolean } = {},
): NotePreviewState {
  const effectiveMaxChar = maxChar ?? 100;
  const [state, setState] = useState<NotePreviewState>({
    isLoading: enabled,
    preview: "",
    hasPreview: false,
  });

  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setState({ isLoading: false, preview: "", hasPreview: false });
      prevPathRef.current = null;
      return;
    }

    const pathChanged = prevPathRef.current !== file.path;
    prevPathRef.current = file.path;

    if (pathChanged) {
      setState({ isLoading: true, preview: "", hasPreview: false });
    }

    let cancelled = false;
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
  }, [file, effectiveMaxChar, enabled]);

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
