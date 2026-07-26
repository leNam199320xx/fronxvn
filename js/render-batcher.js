/**
 * RenderBatcher - Coalesces multiple DOM updates into a single rAF.
 */
export class RenderBatcher {
    constructor() {
        this._scheduled = false;
        this._pending = [];
    }

    schedule(fn) {
        this._pending.push(fn);
        if (!this._scheduled) {
            this._scheduled = true;
            requestAnimationFrame(() => this._flush());
        }
    }

    _flush() {
        this._scheduled = false;
        const fns = this._pending;
        this._pending = [];
        for (let i = 0; i < fns.length; i++) {
            fns[i]();
        }
    }
}

export default new RenderBatcher();
