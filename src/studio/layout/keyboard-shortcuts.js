import eventBus from '../../core/events/event-bus.js';
import {
    ARROW_NUDGE, ARROW_NUDGE_SHIFT
} from '../../core/utilities/config.js';

export class KeyboardShortcuts {
    constructor(editor) {
        this.editor = editor;
        this._bindEvents();
    }

    init() {}

    refresh() {}

    destroy() {
        document.removeEventListener('keydown', this._onKeydown);
    }

    _bindEvents() {
        this._onKeydown = (e) => this._handleKeydown(e);
        document.addEventListener('keydown', this._onKeydown);
    }

    _handleKeydown(e) {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable || e._isIframeContentEditable) {
            return;
        }

        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;

        if (ctrl && !shift && e.key === 'g') {
            e.preventDefault();
            eventBus.emit('group:group');
            return;
        }
        if (ctrl && shift && (e.key === 'g' || e.key === 'G')) {
            e.preventDefault();
            eventBus.emit('group:ungroup');
            return;
        }
        if (ctrl && !shift && e.key === 'z') {
            e.preventDefault();
            eventBus.emit('history:undo');
            return;
        }
        if (ctrl && shift && e.key === 'Z') {
            e.preventDefault();
            eventBus.emit('history:redo');
            return;
        }
        if (ctrl && e.key === 'c') {
            e.preventDefault();
            eventBus.emit('clipboard:copy');
            return;
        }
        if (ctrl && e.key === 'v') {
            e.preventDefault();
            eventBus.emit('clipboard:paste');
            return;
        }
        if (ctrl && e.key === 'x') {
            e.preventDefault();
            eventBus.emit('clipboard:cut');
            return;
        }
        if (ctrl && e.key === 'd') {
            e.preventDefault();
            eventBus.emit('clipboard:duplicate');
            return;
        }
        if (ctrl && !shift && e.key === 'l') {
            e.preventDefault();
            eventBus.emit('element:lock-toggle');
            return;
        }
        if (ctrl && !shift && e.key === 'h') {
            e.preventDefault();
            eventBus.emit('element:hide-toggle');
            return;
        }
        if (ctrl && shift && e.key === ']') {
            e.preventDefault();
            eventBus.emit('element:bring-front');
            return;
        }
        if (ctrl && !shift && e.key === ']') {
            e.preventDefault();
            eventBus.emit('element:move-forward');
            return;
        }
        if (ctrl && !shift && e.key === '[') {
            e.preventDefault();
            eventBus.emit('element:move-backward');
            return;
        }
        if (ctrl && shift && e.key === '[') {
            e.preventDefault();
            eventBus.emit('element:send-back');
            return;
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            eventBus.emit('element:delete');
            return;
        }
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const amount = shift ? ARROW_NUDGE_SHIFT : ARROW_NUDGE;
            let dx = 0, dy = 0;
            if (e.key === 'ArrowUp') dy = -amount;
            if (e.key === 'ArrowDown') dy = amount;
            if (e.key === 'ArrowLeft') dx = -amount;
            if (e.key === 'ArrowRight') dx = amount;
            eventBus.emit('element:move-by', { dx, dy });
            return;
        }
    }
}


