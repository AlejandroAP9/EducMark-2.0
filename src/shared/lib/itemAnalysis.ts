/**
 * Item Analysis (IRT-lite) — AN-19
 * Calculates discrimination index, difficulty index, and distractor analysis.
 */

export interface ItemStats {
    questionIndex: number;
    questionLabel: string;
    /** Difficulty: proportion of students who answered correctly (0-1) */
    difficulty: number;
    /** Discrimination: point-biserial correlation (higher = better) */
    discrimination: number;
    /** Whether the item is potentially defective */
    isDefective: boolean;
    /** Reason if defective */
    defectReason: string | null;
    /** Distractor effectiveness: how many students picked each option */
    distractorDistribution: Record<string, number>;
}

interface StudentResult {
    answers: (string | null)[];
    totalScore: number;
}

/**
 * Analyze all items in an evaluation.
 */
export function analyzeItems(
    studentResults: StudentResult[],
    correctAnswers: string[],
    questionLabels: string[]
): ItemStats[] {
    const n = studentResults.length;
    if (n < 5) return []; // Need minimum 5 students for meaningful analysis

    const stats: ItemStats[] = [];

    for (let q = 0; q < correctAnswers.length; q++) {
        const correctKey = correctAnswers[q];
        const answersForQ = studentResults.map(s => s.answers[q]);

        // Difficulty = proportion correct
        const correctCount = answersForQ.filter(a => a === correctKey).length;
        const difficulty = correctCount / n;

        // Discrimination: Point-biserial correlation
        // Compare scores of students who got this item right vs wrong
        const scoresCorrect = studentResults.filter(s => s.answers[q] === correctKey).map(s => s.totalScore);
        const scoresIncorrect = studentResults.filter(s => s.answers[q] !== correctKey && s.answers[q] !== null).map(s => s.totalScore);

        let discrimination = 0;
        if (scoresCorrect.length > 0 && scoresIncorrect.length > 0) {
            const avgCorrect = scoresCorrect.reduce((a, b) => a + b, 0) / scoresCorrect.length;
            const avgIncorrect = scoresIncorrect.reduce((a, b) => a + b, 0) / scoresIncorrect.length;
            const avgAll = studentResults.reduce((a, s) => a + s.totalScore, 0) / n;
            const sdAll = Math.sqrt(studentResults.reduce((sum, s) => sum + Math.pow(s.totalScore - avgAll, 2), 0) / n);

            if (sdAll > 0) {
                const p = correctCount / n;
                const q_val = 1 - p;
                const yRatio = Math.sqrt(p * q_val);
                discrimination = ((avgCorrect - avgIncorrect) / sdAll) * yRatio;
            }
        }

        // Distractor distribution
        const distrib: Record<string, number> = {};
        answersForQ.forEach(a => {
            const key = a || 'Blanco';
            distrib[key] = (distrib[key] || 0) + 1;
        });

        // Detect defective items
        let isDefective = false;
        let defectReason: string | null = null;

        if (discrimination < 0) {
            isDefective = true;
            defectReason = 'Discriminaci\u00f3n negativa: estudiantes con mejor puntaje total fallaron este \u00edtem';
        } else if (difficulty > 0.95) {
            isDefective = true;
            defectReason = '\u00cdtem demasiado f\u00e1cil (>95% de acierto)';
        } else if (difficulty < 0.1) {
            isDefective = true;
            defectReason = '\u00cdtem demasiado dif\u00edcil (<10% de acierto)';
        } else if (discrimination < 0.1 && difficulty > 0.2 && difficulty < 0.8) {
            isDefective = true;
            defectReason = 'Baja discriminaci\u00f3n: no diferencia entre estudiantes altos y bajos';
        }

        stats.push({
            questionIndex: q,
            questionLabel: questionLabels[q] || `P${q + 1}`,
            difficulty: Math.round(difficulty * 100) / 100,
            discrimination: Math.round(discrimination * 100) / 100,
            isDefective,
            defectReason,
            distractorDistribution: distrib,
        });
    }

    return stats;
}
