import eventBus from '../event-bus.js';
import ViewportCulling from '../core/viewport-culling.js';
import { OVERLAY_BADGE_OFFSET } from '../config.js';

const SEVERITY_BADGE = { error: '🔴', warning: '🟡', info: '🔵' };

export class QualityBadges {
    constructor(overlay) {
        this.overlay = overlay;
    }

    init() {}

    refresh() {}

    destroy() {}

    _updateQualityBadges(issues) {
        const overlay = this.overlay;
        overlay._badges.forEach(badge => badge.remove());
        overlay._badges.clear();

        const elMap = new Map();
        issues.forEach(issue => {
            if (!issue.element) return;
            const current = elMap.get(issue.element);
            if (!current || this._severityRank(issue.severity) > this._severityRank(current)) {
                elMap.set(issue.element, issue.severity);
            }
        });

        elMap.forEach((severity, el) => {
            if (!ViewportCulling.isVisible(el)) return;
            const badge = document.createElement('div');
            badge.className = `quality-badge quality-badge-${severity}`;
            badge.textContent = SEVERITY_BADGE[severity];
            badge.title = `Quality issue: ${severity}`;

            this._positionBadge(badge, el);

            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                eventBus.emit('quality:badge-click', el);
            });

            overlay.layer.appendChild(badge);
            overlay._badges.set(el, badge);
        });
    }

    _positionBadge(badge, el) {
        const overlay = this.overlay;
        const rect = overlay.renderer._getElementScreenRect(el);
        badge.style.position = 'absolute';
        badge.style.left = (rect.left + rect.width - OVERLAY_BADGE_OFFSET) + 'px';
        badge.style.top  = (rect.top - OVERLAY_BADGE_OFFSET) + 'px';
    }

    _refreshBadges() {
        const overlay = this.overlay;
        overlay._badges.forEach((badge, el) => {
            if (ViewportCulling.isVisible(el)) {
                this._positionBadge(badge, el);
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    _severityRank(s) {
        return { error: 3, warning: 2, info: 1 }[s] || 0;
    }
}
