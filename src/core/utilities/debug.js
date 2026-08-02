/**
 * debug.js — Lightweight debug utility.
 *
 * Levels:
 *   'off'     — không log gì cả
 *   'warn'    — chỉ warn() và error()
 *   'action'  — thêm debug.action() (các thao tác quan trọng)
 *   'verbose' — tất cả, bao gồm log thường
 *
 * Mặc định: 'action' — hiển thị các thao tác quan trọng, không spam console.
 */

let _level = 'action'; // 'off' | 'warn' | 'action' | 'verbose'

const LEVELS = { off: 0, warn: 1, action: 2, verbose: 3 };

const _prefix = '[Studio]';

function _ts() {
    return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function setDebugLevel(level) {
    if (level in LEVELS) _level = level;
}

/** @deprecated dùng setDebugLevel('off') thay thế */
export function setDebugEnabled(value) {
    _level = value ? 'action' : 'off';
}

/**
 * Log một thao tác quan trọng (select, save, undo, v.v.)
 * Chỉ hiển thị khi level >= 'action'.
 */
export function debugAction(category, message, data) {
    if (LEVELS[_level] < LEVELS.action) return;
    let log = `${_prefix} [${_ts()}] [${category}] ${message}`;
    if (data !== undefined) {
        try {
            // Chỉ serialize kiểu đơn giản để tránh spam object lớn
            const simplified = typeof data === 'object' && data !== null
                ? Object.fromEntries(
                    Object.entries(data)
                        .filter(([, v]) => typeof v !== 'object' || v === null)
                        .slice(0, 5)
                  )
                : data;
            const str = JSON.stringify(simplified);
            if (str !== '{}') log += ' ' + str;
        } catch (_) {
            log += ' [...]';
        }
    }
    console.log(log);
}

/**
 * Log cảnh báo — luôn hiển thị khi level >= 'warn'.
 */
export function debugWarn(category, message, data) {
    if (LEVELS[_level] < LEVELS.warn) return;
    const log = `${_prefix} [${category}] ${message}`;
    if (data !== undefined) {
        console.warn(log, data);
    } else {
        console.warn(log);
    }
}

/**
 * Log lỗi — luôn hiển thị khi level >= 'warn'.
 */
export function debugError(category, message, data) {
    if (LEVELS[_level] < LEVELS.warn) return;
    const log = `${_prefix} [${category}] ${message}`;
    if (data !== undefined) {
        console.error(log, data);
    } else {
        console.error(log);
    }
}

/**
 * Log verbose — chỉ hiển thị khi level = 'verbose'.
 */
export function debugLog(category, message, data) {
    if (LEVELS[_level] < LEVELS.verbose) return;
    const log = `${_prefix} [${category}] ${message}`;
    data !== undefined ? console.log(log, data) : console.log(log);
}

export function debugGroup(category, message) {
    if (LEVELS[_level] < LEVELS.verbose) return;
    console.group(`${_prefix} [${category}] ${message}`);
}

export function debugGroupEnd() {
    if (LEVELS[_level] < LEVELS.verbose) return;
    console.groupEnd();
}

export default {
    setDebugEnabled,
    setDebugLevel,
    action: debugAction,
    warn:   debugWarn,
    error:  debugError,
    log:    debugLog,
    group:  debugGroup,
    groupEnd: debugGroupEnd
};
