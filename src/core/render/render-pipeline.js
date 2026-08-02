/**
 * RenderPipeline - Standardized editor rendering stages.
 * - All stages go through RenderScheduler
 * - Strict order: Selection â†’ Overlay â†’ Guides â†’ Resize Handles â†’ Rotate Handle â†’ Layer Panel â†’ Property Panel â†’ Quality Badges â†’ Statistics
 * - Each stage runs independently
 * - Failed stages do not stop the pipeline
 * - Only processes dirty stages
 */
import RenderScheduler, { PRIORITY } from './render-scheduler.js';
import DirtyState, { DIRTY } from '../dirty-state.js';

const STAGES = [
    { key: 'pipeline-selection',    priority: PRIORITY.HIGH,   label: 'Selection', dirtyFlag: DIRTY.SELECTION },
    { key: 'pipeline-overlay',      priority: PRIORITY.HIGH,   label: 'Overlay', dirtyFlag: DIRTY.OVERLAY },
    { key: 'pipeline-guides',       priority: PRIORITY.HIGH,   label: 'Guides', dirtyFlag: DIRTY.GUIDES },
    { key: 'pipeline-resize',       priority: PRIORITY.HIGH,   label: 'Resize Handles', dirtyFlag: DIRTY.OVERLAY },
    { key: 'pipeline-rotate',       priority: PRIORITY.HIGH,   label: 'Rotate Handle', dirtyFlag: DIRTY.OVERLAY },
    { key: 'pipeline-layer',        priority: PRIORITY.NORMAL, label: 'Layer Panel', dirtyFlag: DIRTY.LAYER },
    { key: 'pipeline-property',     priority: PRIORITY.NORMAL, label: 'Property Panel', dirtyFlag: DIRTY.PROPERTIES },
    { key: 'pipeline-quality',      priority: PRIORITY.LOW,    label: 'Quality Badges', dirtyFlag: DIRTY.QUALITY },
    { key: 'pipeline-statistics',   priority: PRIORITY.LOW,    label: 'Statistics', dirtyFlag: DIRTY.QUALITY }
];

export class RenderPipeline {
    constructor() {
        this._stages = new Map();
        this._initialized = false;

        this._registerDefaultStages();
    }

    _registerDefaultStages() {
        STAGES.forEach(stage => {
            this._stages.set(stage.key, {
                key: stage.key,
                priority: stage.priority,
                label: stage.label,
                dirtyFlag: stage.dirtyFlag,
                callback: null
            });
        });
    }

    /**
     * Register a callback for a stage.
     * @param {string} stageKey
     * @param {Function} callback
     */
    on(stageKey, callback) {
        const stage = this._stages.get(stageKey);
        if (!stage) {
            console.warn(`[RenderPipeline] Unknown stage: ${stageKey}`);
            return;
        }
        stage.callback = callback;
    }

    /**
     * Unregister a stage callback.
     * @param {string} stageKey
     */
    off(stageKey) {
        const stage = this._stages.get(stageKey);
        if (stage) {
            stage.callback = null;
        }
    }

    /**
     * Trigger the full pipeline.
     * Each stage is scheduled independently through RenderScheduler.
     */
    flush() {
        this._stages.forEach((stage, key) => {
            if (!stage.callback) return;

            RenderScheduler.schedule(key, () => {
                try {
                    stage.callback();
                } catch (err) {
                    console.error(`[RenderPipeline] Stage "${stage.label}" failed:`, err);
                }
            }, stage.priority, stage.dirtyFlag);
        });
    }

    /**
     * Trigger a single stage by key.
     * @param {string} stageKey
     */
    flushStage(stageKey) {
        const stage = this._stages.get(stageKey);
        if (!stage || !stage.callback) return;

        RenderScheduler.schedule(stageKey, () => {
            try {
                stage.callback();
            } catch (err) {
                console.error(`[RenderPipeline] Stage "${stage.label}" failed:`, err);
            }
        }, stage.priority, stage.dirtyFlag);
    }

    /**
     * Get pipeline info for debugging.
     * @returns {Array<{key: string, label: string, priority: number, active: boolean}>}
     */
    getStatus() {
        return STAGES.map(stage => {
            const registered = this._stages.get(stage.key);
            return {
                key: stage.key,
                label: stage.label,
                priority: stage.priority,
                active: !!registered?.callback
            };
        });
    }
}

export default new RenderPipeline();

