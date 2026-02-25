export function handleHistoryShortcut(
  event: KeyboardEvent,
  metaOrCtrl: boolean,
  handlers: { undo: () => void; redo: () => void },
): boolean {
  if (!metaOrCtrl) return false;
  const key = event.key.toLowerCase();
  if (key === 'z') {
    event.preventDefault();
    if (event.shiftKey) handlers.redo();
    else handlers.undo();
    return true;
  }
  if (key !== 'y') return false;
  event.preventDefault();
  handlers.redo();
  return true;
}

export function handleClipboardShortcut(
  event: KeyboardEvent,
  metaOrCtrl: boolean,
  handlers: { copy: () => void; paste: () => void; duplicate: () => void },
): boolean {
  if (!metaOrCtrl) return false;
  const key = event.key.toLowerCase();
  if (key === 'c') {
    event.preventDefault();
    handlers.copy();
    return true;
  }
  if (key === 'v') {
    event.preventDefault();
    handlers.paste();
    return true;
  }
  if (key === 'd') {
    event.preventDefault();
    handlers.duplicate();
    return true;
  }
  return false;
}
