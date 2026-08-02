export class PropertyRegistry {
    constructor() {
        this._properties = new Map();
    }

    register(def) {
        this._properties.set(def.id, def);
    }

    get(id) {
        return this._properties.get(id) || null;
    }

    has(id) {
        return this._properties.has(id);
    }

    getAll() {
        return Array.from(this._properties.values());
    }
}

export const propertyRegistry = new PropertyRegistry();
