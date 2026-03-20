/** Dashboard metric constants */

/** Average minutes saved per generated class */
export const MINUTES_PER_CLASS = 45;

/** Average CLP per hour (Chilean teacher average) */
export const CLP_PER_HOUR = 7500;

/** Average students per class */
export const STUDENTS_PER_CLASS = 35;

/** Plan names mapping */
export const PLAN_DISPLAY_NAMES: Record<string, string> = {
    free: 'Gratis',
    trial: 'Prueba',
    pioneer: 'Pionero',
    basic: 'Copihue',
    copihue: 'Copihue',
    pro: 'Araucaria',
    araucaria: 'Araucaria',
    expert: 'Condor',
    condor: 'Condor',
};

/** All paid plan IDs */
export const PAID_PLAN_IDS = ['pioneer', 'basic', 'copihue', 'pro', 'araucaria', 'expert', 'condor'] as const;
