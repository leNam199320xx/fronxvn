import { calculateScore } from './score.js';

export function buildReport(issues) {
    return {
        issues,
        score: calculateScore(issues)
    };
}
