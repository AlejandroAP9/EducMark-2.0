/**
 * Grade Calculator — OM-17, OM-18, OM-19, AD-10
 * Chilean grading scale: 1.0 - 7.0, configurable passing threshold.
 */

export interface GradeScale {
    /** Minimum passing percentage (default: 60%) */
    passingPercentage: number;
    /** Minimum grade (default: 1.0) */
    minGrade: number;
    /** Maximum grade (default: 7.0) */
    maxGrade: number;
    /** Passing grade (default: 4.0) */
    passingGrade: number;
}

export const DEFAULT_SCALE: GradeScale = {
    passingPercentage: 60,
    minGrade: 1.0,
    maxGrade: 7.0,
    passingGrade: 4.0,
};

/**
 * Calculate grade from raw score using linear interpolation.
 * Below passing: linear from minGrade to passingGrade
 * Above passing: linear from passingGrade to maxGrade
 */
export function calculateGrade(
    correctAnswers: number,
    totalQuestions: number,
    scale: GradeScale = DEFAULT_SCALE
): number {
    if (totalQuestions <= 0) return scale.minGrade;

    const passingScore = (scale.passingPercentage / 100) * totalQuestions;

    let grade: number;

    if (correctAnswers <= 0) {
        grade = scale.minGrade;
    } else if (correctAnswers >= totalQuestions) {
        grade = scale.maxGrade;
    } else if (correctAnswers < passingScore) {
        // Below passing: interpolate from minGrade to passingGrade
        grade = scale.minGrade + ((correctAnswers / passingScore) * (scale.passingGrade - scale.minGrade));
    } else {
        // Above passing: interpolate from passingGrade to maxGrade
        const abovePassing = correctAnswers - passingScore;
        const remainingQuestions = totalQuestions - passingScore;
        grade = scale.passingGrade + ((abovePassing / remainingQuestions) * (scale.maxGrade - scale.passingGrade));
    }

    return Math.round(grade * 10) / 10;
}

/**
 * OM-18: Apply chance correction (discount for guessing).
 * Formula: corrected = correct - (incorrect / (options - 1))
 */
export function applyChanceCorrection(
    correct: number,
    incorrect: number,
    optionsPerQuestion: number
): number {
    if (optionsPerQuestion <= 1) return correct;
    const corrected = correct - (incorrect / (optionsPerQuestion - 1));
    return Math.max(0, Math.round(corrected * 100) / 100);
}

/**
 * OM-19: Recalculate score after annulling specific questions.
 * Annulled questions are removed from total and not counted as incorrect.
 */
export function recalculateWithAnnulled(
    answers: (string | null)[],
    correctAnswers: string[],
    annulledIndices: number[]
): { correct: number; incorrect: number; blank: number; total: number; percentage: number } {
    let correct = 0;
    let incorrect = 0;
    let blank = 0;
    let total = 0;

    answers.forEach((answer, i) => {
        if (annulledIndices.includes(i)) return; // Skip annulled
        total++;
        if (!answer) {
            blank++;
        } else if (answer === correctAnswers[i]) {
            correct++;
        } else {
            incorrect++;
        }
    });

    return {
        correct,
        incorrect,
        blank,
        total,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
}
