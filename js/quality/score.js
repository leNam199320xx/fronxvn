import { PENALTY } from './utils.js';

export function calculateScore(issues) {
    const penalty = issues.reduce((sum, i) => sum + (PENALTY[i.severity] || 0), 0);
    return Math.max(0, 100 - penalty);
}
