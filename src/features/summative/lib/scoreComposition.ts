/**
 * scoreComposition — Combina scores OMR automáticos + scores manuales
 * (desarrollo / respuesta breve) en una única nota final.
 *
 * El OMR scanner devuelve { correct, total } sobre los items con slot OMR.
 * Los items manuales no entran en ese conteo — se guardan en manual_scores
 * con score_awarded + max_score por cada item.
 *
 * Final = OMR.correct + Σ(manual_scores.score_awarded)
 * Total = OMR.total    + Σ(manual_scores.max_score)
 *
 * La nota se calcula con calculateGrade sobre el agregado.
 */
import { calculateGrade, type GradeScale, DEFAULT_SCALE } from '@/shared/lib/gradeCalculator';

export interface OmrScore {
    correct: number;
    total: number;
}

export interface ManualScore {
    score_awarded: number;
    max_score: number;
}

export interface ComposedScore {
    /** Score OMR + manual sumados (numerador) */
    totalAwarded: number;
    /** Puntaje máximo OMR + manual (denominador) */
    totalMax: number;
    /** Porcentaje 0-100 */
    percentage: number;
    /** Nota final 1.0-7.0 según gradeScale */
    grade: number;
    /** Cuántos items manuales aún no se corrigieron (pendientes) */
    pendingManual: number;
}

/**
 * Compone la nota final combinando OMR + scores manuales.
 * Si hay items manuales pendientes, `pendingManual > 0` y el profe debe
 * corregirlos antes de que la nota sea definitiva.
 */
export function composeFinalScore(
    omr: OmrScore,
    manualScores: ManualScore[],
    manualItemsTotal: number = manualScores.length,
    gradeScale: GradeScale = DEFAULT_SCALE
): ComposedScore {
    const manualAwarded = manualScores.reduce((sum, m) => sum + (m.score_awarded || 0), 0);
    const manualMax = manualScores.reduce((sum, m) => sum + (m.max_score || 0), 0);

    // Items manuales esperados pero aún no corregidos.
    // Cada uno vale 1 punto por defecto en el max total pendiente.
    const pendingManual = Math.max(0, manualItemsTotal - manualScores.length);
    const pendingMax = pendingManual; // 1 pt por default por item pendiente

    const totalAwarded = omr.correct + manualAwarded;
    const totalMax = omr.total + manualMax + pendingMax;

    const percentage = totalMax > 0 ? Math.round((totalAwarded / totalMax) * 100) : 0;
    const grade = calculateGrade(totalAwarded, totalMax, gradeScale);

    return {
        totalAwarded,
        totalMax,
        percentage,
        grade,
        pendingManual,
    };
}
