import { checkAltMissing } from './alt.js';
import { checkDuplicateIds } from './duplicate-id.js';
import { checkEmptyHeading } from './empty-heading.js';
import { checkEmptyLink } from './empty-link.js';
import { checkLabelMissing } from './label.js';
import { checkMissingH1 } from './missing-h1.js';
import { checkLowContrast } from './contrast.js';
import { checkAutoplayVideo } from './autoplay-video.js';
import { checkDeepNesting } from './deep-nesting.js';
import { checkElementTooSmall } from './element-too-small.js';

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

