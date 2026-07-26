let _enabled = true;
const _prefix = '[DEBUG]';

export function setDebugEnabled(value) {
    _enabled = value;
}

export function debugAction(category, message, data) {
    if (!_enabled) return;
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    let log = `${_prefix} [${ts}] [${category}] ${message}`;
    if (data !== undefined) {
        try {
            log += ' | ' + JSON.stringify(data);
        } catch (_) {
            log += ' | [circular]';
        }
    }
    console.log(log);
}

export function debugGroup(category, message) {
    if (!_enabled) return;
    console.group(`${_prefix} [${category}] ${message}`);
}

export function debugGroupEnd() {
    if (!_enabled) return;
    console.groupEnd();
}

export default {
    setDebugEnabled,
    action: debugAction,
    group: debugGroup,
    groupEnd: debugGroupEnd
};
