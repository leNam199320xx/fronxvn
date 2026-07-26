/**
 * QualityPanel — Issues Panel cho tab "Quality" trong right panel.
 * Render danh sách issues theo severity, Go to + Fix actions.
 * Cũng quản lý Quality Score badge trên toolbar.
 */
import eventBus from './event-bus.js';
import { QUALITY_SCORE_INITIAL, QUALITY_RESCAN_AFTER_FIX_DELAY, QUALITY_SCORE_GOOD, QUALITY_SCORE_WARN } from './config.js';
import RenderPipeline from '../core/render-pipeline.js';

const SEVERITY_ICON  = { error: '🔴', warning: '🟡', info: '🔵' };
const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 };

export class QualityPanel {
    constructor(editor) {
        this.editor  = editor;
        this.issues  = [];
        this.score   = QUALITY_SCORE_INITIAL;

        this._container  = document.querySelector('#panel-right');
        this._scoreLabel = document.getElementById('quality-score-label');
        this._scoreBtn   = document.getElementById('btn-quality');

        this._render();
        this._bindEvents();
        this._registerPipeline();
    }

    _registerPipeline() {
        RenderPipeline.on('pipeline-quality', () => this._render());
    }

    // ─────────────────────────────────────────────
    //  Events
    // ─────────────────────────────────────────────

    _bindEvents() {
        eventBus.on('quality:updated', ({ issues, score }) => {
            this.issues = issues;
            this.score  = score;
            RenderPipeline.flushStage('pipeline-quality');
            this._updateScoreBadge();
        });

        // Click badge trên canvas → mở tab Quality + highlight issue
        eventBus.on('quality:badge-click', (el) => {
            this._openQualityTab();
            this._highlightIssuesForElement(el);
        });

        // Click nút Quality Score trên toolbar → mở tab Quality
        this._scoreBtn?.addEventListener('click', () => this._openQualityTab());
    }

    // ─────────────────────────────────────────────
    //  Render
    // ─────────────────────────────────────────────

    _render() {
        if (!this._container) return;
        this._container.innerHTML = '';

        const section = document.createElement('div');
        section.className = 'panel-section';

        const header = document.createElement('div');
        header.className = 'panel-section-header';
        header.innerHTML = 'Quality <span class="arrow">▼</span>';

        const body = document.createElement('div');
        body.className = 'panel-section-body';

        // ── Header ───────────────────────────────────────────────────────────
        const qualityHeader = document.createElement('div');
        qualityHeader.className = 'quality-panel-header';

        const counts = { error: 0, warning: 0, info: 0 };
        this.issues.forEach(i => { if (counts[i.severity] !== undefined) counts[i.severity]++; });

        qualityHeader.innerHTML = `
            <div class="quality-summary">
                <span class="q-error">${SEVERITY_ICON.error} ${counts.error} error${counts.error !== 1 ? 's' : ''}</span>
                <span class="q-warning">${SEVERITY_ICON.warning} ${counts.warning} warning${counts.warning !== 1 ? 's' : ''}</span>
                <span class="q-info">${SEVERITY_ICON.info} ${counts.info} info</span>
            </div>
            <button class="quality-rescan-btn" title="Rescan now">⟳ Scan</button>
        `;
        qualityHeader.querySelector('.quality-rescan-btn').addEventListener('click', () => {
            this.editor.qualityEngine?.scanNow();
        });
        body.appendChild(qualityHeader);

        // ── Empty state ───────────────────────────────────────────────────────
        if (this.issues.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'quality-empty';
            empty.innerHTML = `<span>✅</span><p>No issues found</p>`;
            body.appendChild(empty);
        } else {
            const sorted = [...this.issues].sort(
                (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
            );

            const list = document.createElement('div');
            list.className = 'quality-issue-list';

            sorted.forEach(issue => {
                const item = this._buildIssueItem(issue);
                list.appendChild(item);
            });

            body.appendChild(list);
        }

        header.addEventListener('click', () => {
            header.classList.toggle('collapsed');
            body.classList.toggle('collapsed');
        });

        section.appendChild(header);
        section.appendChild(body);
        this._container.appendChild(section);
    }

    /**
     * Tạo DOM cho một issue item.
      * @param {import('./quality/index.js').Issue} issue
     * @returns {HTMLElement}
     */
    _buildIssueItem(issue) {
        const item = document.createElement('div');
        item.className = `quality-issue quality-issue-${issue.severity}`;
        item.dataset.issueId = issue.id;

        const icon    = SEVERITY_ICON[issue.severity];
        const elName  = issue.element
            ? (issue.element.dataset.name || issue.element.id || issue.element.tagName.toLowerCase())
            : 'Page';

        item.innerHTML = `
            <div class="quality-issue-main">
                <span class="quality-issue-icon">${icon}</span>
                <div class="quality-issue-body">
                    <div class="quality-issue-message">${this._escapeHtml(issue.message)}</div>
                    <div class="quality-issue-suggestion">${this._escapeHtml(issue.suggestion)}</div>
                </div>
            </div>
            <div class="quality-issue-actions"></div>
        `;

        const actions = item.querySelector('.quality-issue-actions');

        // Nút "Go to" — chỉ khi có element
        if (issue.element) {
            const gotoBtn = document.createElement('button');
            gotoBtn.className = 'quality-btn quality-btn-goto';
            gotoBtn.textContent = 'Go to';
            gotoBtn.addEventListener('click', () => {
                this.editor.selection.select(issue.element);
                issue.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                eventBus.emit('element:selected', issue.element);
            });
            actions.appendChild(gotoBtn);
        }

        // Nút "Fix" — chỉ khi có autofix
        if (issue.autofix) {
            const fixBtn = document.createElement('button');
            fixBtn.className = 'quality-btn quality-btn-fix';
            fixBtn.textContent = 'Fix';
            fixBtn.addEventListener('click', () => {
                issue.autofix();
                // Rescan sau fix
                setTimeout(() => this.editor.qualityEngine?.scanNow(), QUALITY_RESCAN_AFTER_FIX_DELAY);
            });
            actions.appendChild(fixBtn);
        }

        return item;
    }

    // ─────────────────────────────────────────────
    //  Score badge
    // ─────────────────────────────────────────────

    _updateScoreBadge() {
        if (!this._scoreLabel || !this._scoreBtn) return;

        this._scoreLabel.textContent = `Q: ${this.score}`;

        // Màu theo score
        this._scoreBtn.classList.remove('q-score-good', 'q-score-warn', 'q-score-bad');
        if (this.score >= QUALITY_SCORE_GOOD) {
            this._scoreBtn.classList.add('q-score-good');
        } else if (this.score >= QUALITY_SCORE_WARN) {
            this._scoreBtn.classList.add('q-score-warn');
        } else {
            this._scoreBtn.classList.add('q-score-bad');
        }
    }

    // ─────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────

    /** Mở tab Quality trong right panel. */
    _openQualityTab() {
        const tab = document.querySelector('.panel-tab[data-tab="quality"]');
        if (!tab) return;
        tab.click();
    }

    /** Highlight tất cả issue items liên quan đến element. */
    _highlightIssuesForElement(el) {
        if (!this._container) return;
        this._container.querySelectorAll('.quality-issue').forEach(item => {
            item.classList.remove('highlighted');
        });

        // Tìm issues của element này
        const ids = this.issues
            .filter(i => i.element === el)
            .map(i => i.id);

        ids.forEach(id => {
            const item = this._container.querySelector(`[data-issue-id="${id}"]`);
            if (item) {
                item.classList.add('highlighted');
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }

    _escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}
