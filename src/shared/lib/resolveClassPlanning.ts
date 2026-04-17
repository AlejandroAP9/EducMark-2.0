/**
 * Resuelve el planning_blocks real de una clase — con fallback a planning_sequences
 * cuando generated_classes.planning_blocks esté vacío (clases pobladas por n8n antes
 * de que la pipeline guardara estructura completa en generated_classes).
 *
 * Uso:
 *   const { blocks, source } = await resolveClassPlanning(classId);
 *   if (source === 'planning_sequences') { ... toast opcional ... }
 */
import type { PlanningBlocks } from '@/features/dashboard/components/KitResultTypes';
import { EMPTY_BLOCKS } from '@/features/dashboard/components/KitResultTypes';

export type PlanningSource = 'planning_blocks' | 'planning_sequences' | 'empty';

export interface ResolvedPlanning {
    blocks: PlanningBlocks;
    source: PlanningSource;
}

export async function resolveClassPlanning(classId: string): Promise<ResolvedPlanning> {
    try {
        const res = await fetch(`/api/classes/${classId}/planning`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
        if (!res.ok) {
            return { blocks: { ...EMPTY_BLOCKS }, source: 'empty' };
        }
        const data = await res.json();
        return {
            blocks: { ...EMPTY_BLOCKS, ...(data.blocks || {}) },
            source: (data.source as PlanningSource) ?? 'empty',
        };
    } catch {
        return { blocks: { ...EMPTY_BLOCKS }, source: 'empty' };
    }
}

/**
 * True si los bloques están "efectivamente vacíos" — sin texto en ninguna
 * sección crítica (objetivo / inicio / desarrollo / cierre). Útil antes de
 * gastar una llamada al endpoint de resolve.
 */
export function isPlanningEmpty(b: PlanningBlocks | null | undefined): boolean {
    if (!b) return true;
    return (
        !b.objective?.trim() &&
        !b.inicio?.trim() &&
        !b.desarrollo?.trim() &&
        !b.cierre?.trim() &&
        !b.planningText?.trim()
    );
}
