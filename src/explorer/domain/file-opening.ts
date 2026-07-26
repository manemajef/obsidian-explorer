export type OpenFileRequest = {
  newLeaf?: boolean;
};

export type FilePresentation = {
  newLeaf: boolean;
  markNavigationPending: boolean;
  forceReadingMode: boolean;
};

export function resolveFilePresentation(input: {
  isFolderNote: boolean;
  forceReadingMode: boolean;
  request?: OpenFileRequest;
}): FilePresentation {
  return {
    newLeaf: input.request?.newLeaf ?? false,
    markNavigationPending: input.isFolderNote,
    forceReadingMode: input.isFolderNote && input.forceReadingMode,
  };
}
