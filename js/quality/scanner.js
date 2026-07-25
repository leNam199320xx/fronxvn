import { checkAltMissing } from './rules/alt.js';
import { checkDuplicateIds } from './rules/duplicate-id.js';
import { checkEmptyHeading } from './rules/empty-heading.js';
import { checkEmptyLink } from './rules/empty-link.js';
import { checkLabelMissing } from './rules/label.js';
import { checkMissingH1 } from './rules/missing-h1.js';
import { checkLowContrast } from './rules/contrast.js';
import { checkAutoplayVideo } from './rules/autoplay-video.js';
import { checkDeepNesting } from './rules/deep-nesting.js';
import { checkElementTooSmall } from './rules/element-too-small.js';

export function runScan(editor, eventBus) {
    const issues = [];
    const elements = Array.from(editor.canvas.querySelectorAll('[data-editor-element]'));

    checkDuplicateIds(elements, issues);
    checkMissingH1(elements, issues);

    elements.forEach(el => {
        checkAltMissing(editor, eventBus, el, issues);
        checkEmptyHeading(el, issues);
        checkLabelMissing(editor, eventBus, el, issues);
        checkElementTooSmall(el, issues);
        checkDeepNesting(editor, el, issues);
        checkLowContrast(el, issues);
        checkEmptyLink(editor, eventBus, el, issues);
        checkAutoplayVideo(editor, eventBus, el, issues);
    });

    return issues;
}
