// Type definitions for the JSON structure
export type OA = {
    label?: string; // Some grades use 'label'
    id?: string;    // Some grades use 'id'
    description: string;
    topic?: string;
};

export type Unit = {
    name: string;
    oas: OA[];
};

type Curriculum = {
    [grade: string]: {
        [subject: string]: Unit[];
    };
};

// Lazy-loaded curriculum data (cached after first load)
let cachedCurriculum: Curriculum | null = null;
let loadingPromise: Promise<Curriculum> | null = null;

/**
 * Loads the curriculum data dynamically from public/data/curriculumData.json
 * Uses caching to avoid reloading on subsequent calls
 */
const loadCurriculum = async (): Promise<Curriculum> => {
    // Return cached data if available
    if (cachedCurriculum) {
        return cachedCurriculum;
    }

    // If already loading, return the same promise to avoid duplicate requests
    if (loadingPromise) {
        return loadingPromise;
    }

    // Start loading
    loadingPromise = fetch('/data/curriculumData.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load curriculum data: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            cachedCurriculum = data as Curriculum;
            return cachedCurriculum;
        })
        .catch(error => {
            console.error('Error loading curriculum data:', error);
            loadingPromise = null; // Reset so it can retry
            throw error;
        });

    return loadingPromise;
};

// Return the full unit object so we can show OA previews in the UI
export const fetchUnitsStatic = async (grade: string, subject: string): Promise<Unit[]> => {
    const curriculum = await loadCurriculum();

    const gradeData = curriculum[grade];
    if (!gradeData) {
        console.warn(`Grade not found in static data: ${grade}`);
        return [];
    }

    // Try exact match first
    let subjectData = gradeData[subject];

    // Fuzzy match: subject names vary between grades in Chilean curriculum
    // Uses alias map to handle known naming variations safely
    if (!subjectData) {
        const SUBJECT_ALIASES: Record<string, string[]> = {
            'Historia': ['Historia, Geografía y Ciencias Sociales', 'Comprensión Histórica del Presente'],
            'Lenguaje': ['Lenguaje y Comunicación', 'Lengua y Literatura'],
            'Educación Física': ['Educación Física y Salud'],
            'Ciencias Naturales': ['Ciencias para la Ciudadanía'],
            'Matemática': ['Matemáticas'],
        };

        // Check alias map first (exact alias match)
        const aliases = SUBJECT_ALIASES[subject] || [];
        for (const alias of aliases) {
            if (gradeData[alias]) {
                subjectData = gradeData[alias];
                break;
            }
        }

        // If still not found, try safe fuzzy: JSON key starts with UI subject
        // e.g. "Biología" matches "Biología de los ecosistemas"
        // But "Física" should NOT match "Educación Física"
        if (!subjectData) {
            const subjectLower = subject.toLowerCase();
            const subjectKeys = Object.keys(gradeData);
            const fuzzyMatch = subjectKeys.find(s => {
                const sLower = s.toLowerCase();
                // Key starts with the subject (safe: "Biología" → "Biología de los ecosistemas")
                return sLower.startsWith(subjectLower);
            });
            if (fuzzyMatch) {
                subjectData = gradeData[fuzzyMatch];
            }
        }
    }

    if (!subjectData) {
        console.warn(`Subject not found in static data: ${subject} for grade ${grade}`);
        return [];
    }

    return subjectData;
};

export const fetchOAsStatic = async (grade: string, subject: string, unitName: string): Promise<OA[]> => {
    const curriculum = await loadCurriculum();

    const gradeData = curriculum[grade];
    if (!gradeData) return [];

    // Try exact match first, then alias map + safe fuzzy for subject
    let subjectData = gradeData[subject];

    if (!subjectData) {
        const SUBJECT_ALIASES: Record<string, string[]> = {
            'Historia': ['Historia, Geografía y Ciencias Sociales', 'Comprensión Histórica del Presente'],
            'Lenguaje': ['Lenguaje y Comunicación', 'Lengua y Literatura'],
            'Educación Física': ['Educación Física y Salud'],
            'Ciencias Naturales': ['Ciencias para la Ciudadanía'],
            'Matemática': ['Matemáticas'],
        };
        const aliases = SUBJECT_ALIASES[subject] || [];
        for (const alias of aliases) {
            if (gradeData[alias]) { subjectData = gradeData[alias]; break; }
        }
        if (!subjectData) {
            const subjectLower = subject.toLowerCase();
            const fuzzyMatch = Object.keys(gradeData).find(s => s.toLowerCase().startsWith(subjectLower));
            if (fuzzyMatch) subjectData = gradeData[fuzzyMatch];
        }
    }

    if (!subjectData) return [];

    const normalizedInput = unitName.toLowerCase().trim();

    // Attempt exact match first
    let unit = subjectData.find(u => u.name === unitName);

    // Attempt fuzzy match with boundary protection
    if (!unit) {
        unit = subjectData.find(u => {
            const normalizedUnitName = u.name.toLowerCase();
            if (normalizedUnitName === normalizedInput) return true;

            // Check if it starts with input followed by a separator to avoid "Unidad 1" matching "Unidad 10"
            if (normalizedUnitName.startsWith(normalizedInput)) {
                const nextChar = normalizedUnitName[normalizedInput.length];
                // Valid separators: undefined (end of string), space, colon, or parenthesis
                if (!nextChar || [' ', ':', '(', '-'].includes(nextChar)) {
                    return true;
                }
            }

            return false;
        });
    }

    if (!unit) {
        console.warn(`Unit not found: ${unitName}`);
        return [];
    }

    return unit.oas;
};

// Helper to get available Grades and Subjects for the Step 1 selector
export const getAvailableOptions = async () => {
    const curriculum = await loadCurriculum();

    const grades = Object.keys(curriculum);
    const allSubjects = new Set<string>();
    const validPairs: Record<string, string[]> = {};

    grades.forEach(g => {
        const subjects = Object.keys(curriculum[g]);
        validPairs[g] = subjects;
        subjects.forEach(s => allSubjects.add(s));
    });

    return {
        grades: grades,
        subjects: Array.from(allSubjects).sort(),
        validPairs
    };
};

/**
 * Preload curriculum data in background (call this early to warm the cache)
 */
export const preloadCurriculum = () => {
    loadCurriculum().catch(() => {
        // Silently ignore preload errors - will retry on actual use
    });
};
