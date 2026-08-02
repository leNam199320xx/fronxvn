import CanvasAPI from '../../core/canvas/canvas-api.js';
import Benchmark from '../../core/render/benchmark.js';
import RenderProfiler from '../../core/render/render-profiler.js';

await CanvasAPI.init();
const { Editor } = await import('./editor.js');
window.editor = new Editor();
window.benchmark = Benchmark;
window.profiler = RenderProfiler;

export { CanvasAPI, Benchmark, RenderProfiler };
