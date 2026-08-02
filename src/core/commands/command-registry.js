export class CommandRegistry {
    constructor() {
        this._commands = new Map();
    }

    register(name, fn) {
        this._commands.set(name, fn);
    }

    get(name) {
        return this._commands.get(name);
    }

    has(name) {
        return this._commands.has(name);
    }

    getAll() {
        return Array.from(this._commands.keys());
    }
}

export const commandRegistry = new CommandRegistry();