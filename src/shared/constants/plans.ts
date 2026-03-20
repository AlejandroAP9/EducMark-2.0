export type PlanType = 'free' | 'copihue' | 'araucaria' | 'condor';

export const PLAN_NAMES: Record<PlanType, string> = {
    free: 'Plan Gratuito',
    copihue: 'Plan Copihue',
    araucaria: 'Plan Araucaria',
    condor: 'Plan Condor',
};

export const PLAN_LIMITS: Record<PlanType, { classes: number; images: number }> = {
    free: { classes: 3, images: 27 },
    copihue: { classes: 20, images: 180 },
    araucaria: { classes: 35, images: 315 },
    condor: { classes: 50, images: 450 },
};

export const PLAN_HIERARCHY: PlanType[] = ['free', 'copihue', 'araucaria', 'condor'];
