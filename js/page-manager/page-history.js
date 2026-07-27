export function saveHistoryToPage(editor, page) {
    if (!page || !editor.history) return;
    page.historyState = {
        undoStack: JSON.parse(JSON.stringify(editor.history.undoStack)),
        redoStack: JSON.parse(JSON.stringify(editor.history.redoStack))
    };
}

export function restoreHistoryFromPage(editor, page) {
    if (!editor.history || !page) return;
    editor.history.undoStack = JSON.parse(JSON.stringify(page.historyState?.undoStack || []));
    editor.history.redoStack = JSON.parse(JSON.stringify(page.historyState?.redoStack || []));
}
