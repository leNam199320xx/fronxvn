export function saveHistoryToPage(editor, page) {
    if (!page || !editor.history) return;
    page.historyState = {
        undoStack: [...editor.history.undoStack],
        redoStack: [...editor.history.redoStack]
    };
}

export function restoreHistoryFromPage(editor, page) {
    if (!editor.history || !page) return;
    editor.history.undoStack = page.historyState?.undoStack || [];
    editor.history.redoStack = page.historyState?.redoStack || [];
}
