export class CommandManager {
    constructor() {
        this._commands = new Map();
    }

    register(name, fn) {
        this._commands.set(name, fn);
    }

    execute(name, ...args) {
        const fn = this._commands.get(name);
        if (fn) return fn(...args);
    }

    get(name) {
        return this._commands.get(name);
    }
}

export const commandManager = new CommandManager();