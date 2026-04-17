/**
 * Clasificador Bloom para EducMark.
 *
 * Mapea habilidades cognitivas (strings en español) a niveles numéricos
 * de la taxonomía de Bloom revisada:
 *
 *   1 — Recordar        (reconocer, identificar, listar)
 *   2 — Comprender      (explicar, resumir, interpretar)
 *   3 — Aplicar         (usar, resolver, implementar)
 *   4 — Analizar        (comparar, diferenciar, organizar)
 *   5 — Evaluar         (juzgar, criticar, justificar)
 *   6 — Crear           (diseñar, proponer, producir)
 *
 * Uso típico:
 *   const lvl = classifyBloomLevel(item.cognitive_skill);
 *   if (lvl && lvl < 3) flag('bajo nivel para Carrera Docente');
 *
 * Carrera Docente (rúbricas CPEIP 2025) premia evaluaciones con
 * preguntas mayoritariamente en niveles 3+ (Aplicar o superior).
 */

export type BloomLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface BloomInfo {
    level: BloomLevel;
    label: string;
    family: string;
}

const BLOOM_LABELS: Record<BloomLevel, string> = {
    1: 'Recordar',
    2: 'Comprender',
    3: 'Aplicar',
    4: 'Analizar',
    5: 'Evaluar',
    6: 'Crear',
};

const KEYWORD_TO_LEVEL: Array<{ patterns: RegExp; level: BloomLevel }> = [
    // Nivel 6 — Crear
    { patterns: /\b(crear|crea|crearlo|dise[ñn]ar|dise[ñn]o|producir|producto|elaborar|construir|proponer|inventar|generar|componer|formular)\b/i, level: 6 },
    // Nivel 5 — Evaluar
    { patterns: /\b(evaluar|eval[úu]a|juzgar|criticar|cr[íi]tica|justificar|argumentar|sostener|defender|valorar|valorizar|ponderar|concluir)\b/i, level: 5 },
    // Nivel 4 — Analizar
    { patterns: /\b(analizar|analiza|analis[i]s|comparar|compara|contrastar|diferenciar|clasificar|categorizar|organizar|relacionar|distinguir|examinar|desglosar|inferir|deducir)\b/i, level: 4 },
    // Nivel 3 — Aplicar
    { patterns: /\b(aplicar|aplica|usar|usa|utilizar|utiliza|resolver|resuelve|calcular|calcula|ejecutar|implementar|operar|demostrar|ejemplificar|ilustrar)\b/i, level: 3 },
    // Nivel 2 — Comprender
    { patterns: /\b(comprender|comprende|comprensi[óo]n|entender|explicar|explica|resumir|resume|interpretar|interpreta|parafrasear|traducir|describir|ejemplificar[- ]simple|ejemplo|clasificar[- ]simple|predecir)\b/i, level: 2 },
    // Nivel 1 — Recordar
    { patterns: /\b(recordar|recuerda|recordaci[óo]n|identificar|identifica|reconocer|reconoce|listar|lista|nombrar|nombra|memorizar|repetir|definir[- ]literal|rotular|marcar)\b/i, level: 1 },
];

/**
 * Clasifica una habilidad cognitiva en un nivel Bloom. Devuelve null si no
 * se pudo mapear (el string no contiene ninguno de los verbos conocidos).
 */
export function classifyBloomLevel(skill: string | null | undefined): BloomLevel | null {
    if (!skill) return null;
    const lower = skill.trim().toLowerCase();
    if (!lower) return null;

    // Si ya viene como "Bloom 4" o "Nivel 3"
    const directMatch = lower.match(/bloom\s*(\d)|nivel\s*(\d)|^(\d)\s*[-\u2014]/i);
    if (directMatch) {
        const n = parseInt(directMatch[1] || directMatch[2] || directMatch[3], 10);
        if (n >= 1 && n <= 6) return n as BloomLevel;
    }

    // Match por palabras clave, empezando por el nivel más alto (más específico gana)
    for (const { patterns, level } of KEYWORD_TO_LEVEL) {
        if (patterns.test(lower)) return level;
    }
    return null;
}

export function bloomInfo(skill: string | null | undefined): BloomInfo | null {
    const level = classifyBloomLevel(skill);
    if (!level) return null;
    return {
        level,
        label: BLOOM_LABELS[level],
        family: level >= 4 ? 'superior' : level >= 3 ? 'aplicación' : 'básico',
    };
}

/**
 * Calcula el porcentaje de items en niveles Bloom 3+ (aplicación o superior),
 * útil para mostrar en el dashboard/pauta si la evaluación está en rango
 * esperado por Carrera Docente.
 */
export function percentBloomThreeOrHigher(
    items: Array<{ cognitive_skill?: string | null }>
): number {
    if (items.length === 0) return 0;
    const countHigh = items.filter((i) => {
        const lvl = classifyBloomLevel(i.cognitive_skill);
        return lvl !== null && lvl >= 3;
    }).length;
    return Math.round((countHigh / items.length) * 100);
}

export { BLOOM_LABELS };
