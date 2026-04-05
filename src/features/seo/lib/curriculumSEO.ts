import fs from 'fs';
import path from 'path';

// ── Types ──

export interface CurriculumOA {
  label?: string;
  id?: string;
  description: string;
}

/** Get the display label for an OA, handling both 'label' and 'id' fields */
export function getOALabel(oa: CurriculumOA): string {
  return oa.label || oa.id || 'OA';
}

export interface CurriculumUnit {
  name: string;
  oas: CurriculumOA[];
}

export type CurriculumData = Record<string, Record<string, CurriculumUnit[]>>;

export interface OAPageParams {
  asignatura: string;
  nivel: string;
  oa: string;
}

export interface OAPageData {
  grade: string;
  subject: string;
  unit: CurriculumUnit;
  oa: CurriculumOA;
  oaIndex: number;
  unitIndex: number;
  siblingOAs: { label: string; slug: string }[];
  totalOAsInLevel: number;
}

// ── Data Loading (server-side only, fs) ──

let _cache: CurriculumData | null = null;

export function loadCurriculum(): CurriculumData {
  if (_cache) return _cache;
  const filePath = path.join(process.cwd(), 'public', 'data', 'curriculumData.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  _cache = JSON.parse(raw) as CurriculumData;
  return _cache;
}

// ── Slug Helpers ──

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[°º]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function slugifyGrade(grade: string): string {
  // "1° Básico" → "1-basico", "III° Medio" → "iii-medio"
  return slugify(grade);
}

export function slugifySubject(subject: string): string {
  // "Historia, Geografía y Ciencias Sociales" → "historia-geografia-y-ciencias-sociales"
  return slugify(subject);
}

export function slugifyOA(oa: CurriculumOA, unitIndex: number): string {
  // "OA 1" in unit 0 → "oa-1-u1", "OA 3" in unit 2 → "oa-3-u3"
  const label = getOALabel(oa);
  const oaNum = label.replace(/[^0-9]/g, '') || '0';
  return `oa-${oaNum}-u${unitIndex + 1}`;
}

// ── Reverse Lookup (slug → real data) ──

export function findBySlug(
  data: CurriculumData,
  asigSlug: string,
  nivelSlug: string,
  oaSlug?: string
): OAPageData | null {
  for (const grade of Object.keys(data)) {
    if (slugifyGrade(grade) !== nivelSlug) continue;

    for (const subject of Object.keys(data[grade])) {
      if (slugifySubject(subject) !== asigSlug) continue;

      const units = data[grade][subject];

      if (!oaSlug) {
        // Return minimal data for nivel page
        return {
          grade,
          subject,
          unit: units[0],
          oa: units[0]?.oas[0],
          oaIndex: 0,
          unitIndex: 0,
          siblingOAs: [],
          totalOAsInLevel: units.reduce((acc, u) => acc + u.oas.length, 0),
        };
      }

      // Find specific OA
      for (let ui = 0; ui < units.length; ui++) {
        const unit = units[ui];
        for (let oi = 0; oi < unit.oas.length; oi++) {
          const oa = unit.oas[oi];
          if (slugifyOA(oa, ui) === oaSlug) {
            const siblingOAs = units.flatMap((u, idx) =>
              u.oas.map((o) => ({
                label: `${getOALabel(o)} — ${u.name.split(':')[0]}`,
                slug: slugifyOA(o, idx),
              }))
            );
            return {
              grade,
              subject,
              unit,
              oa,
              oaIndex: oi,
              unitIndex: ui,
              siblingOAs,
              totalOAsInLevel: units.reduce((acc, u) => acc + u.oas.length, 0),
            };
          }
        }
      }
    }
  }
  return null;
}

// ── Static Params Generators ──

export function getAllSubjectSlugs(): { asignatura: string }[] {
  const data = loadCurriculum();
  const seen = new Set<string>();
  const results: { asignatura: string }[] = [];

  for (const grade of Object.keys(data)) {
    for (const subject of Object.keys(data[grade])) {
      const slug = slugifySubject(subject);
      if (!seen.has(slug)) {
        seen.add(slug);
        results.push({ asignatura: slug });
      }
    }
  }
  return results;
}

export function getAllNivelSlugs(): { asignatura: string; nivel: string }[] {
  const data = loadCurriculum();
  const results: { asignatura: string; nivel: string }[] = [];

  for (const grade of Object.keys(data)) {
    for (const subject of Object.keys(data[grade])) {
      results.push({
        asignatura: slugifySubject(subject),
        nivel: slugifyGrade(grade),
      });
    }
  }
  return results;
}

export function getAllOASlugs(): OAPageParams[] {
  const data = loadCurriculum();
  const results: OAPageParams[] = [];

  for (const grade of Object.keys(data)) {
    for (const subject of Object.keys(data[grade])) {
      const units = data[grade][subject];
      for (let ui = 0; ui < units.length; ui++) {
        for (const oa of units[ui].oas) {
          results.push({
            asignatura: slugifySubject(subject),
            nivel: slugifyGrade(grade),
            oa: slugifyOA(oa, ui),
          });
        }
      }
    }
  }
  return results;
}

// ── Reverse Subject Slug → Display Names ──

export function getSubjectDisplayNames(asigSlug: string): { subjects: string[]; grades: string[] } {
  const data = loadCurriculum();
  const subjects = new Set<string>();
  const grades: string[] = [];

  for (const grade of Object.keys(data)) {
    for (const subject of Object.keys(data[grade])) {
      if (slugifySubject(subject) === asigSlug) {
        subjects.add(subject);
        grades.push(grade);
      }
    }
  }
  return { subjects: Array.from(subjects), grades };
}

// ── Content Templates ──

export function generateActivities(oa: CurriculumOA, subject: string, grade: string): string[] {
  const desc = oa.description.toLowerCase();
  const activities: string[] = [];

  // Generic pedagogical activities based on Bloom's taxonomy keywords
  if (desc.includes('identificar') || desc.includes('reconocer') || desc.includes('nombrar'))
    activities.push('Actividad de clasificación con organizador gráfico');
  if (desc.includes('analizar') || desc.includes('comparar') || desc.includes('evaluar'))
    activities.push('Análisis comparativo con tabla de doble entrada');
  if (desc.includes('explicar') || desc.includes('describir') || desc.includes('comunicar'))
    activities.push('Exposición oral con apoyo visual (PPT generado por IA)');
  if (desc.includes('investigar') || desc.includes('indagar'))
    activities.push('Proyecto de investigación guiada con fuentes primarias');
  if (desc.includes('crear') || desc.includes('diseñar') || desc.includes('elaborar'))
    activities.push('Taller práctico de creación con rúbrica de evaluación');
  if (desc.includes('resolver') || desc.includes('calcular') || desc.includes('aplicar'))
    activities.push('Guía de ejercicios con dificultad progresiva');
  if (desc.includes('experimentar') || desc.includes('observar'))
    activities.push('Laboratorio o experiencia práctica con registro de observación');
  if (desc.includes('leer') || desc.includes('comprender') || desc.includes('interpretar'))
    activities.push('Lectura guiada con preguntas de comprensión multinivel');

  // Always include at least 3
  if (activities.length < 3) {
    activities.push('Trabajo colaborativo en grupos con roles asignados');
    activities.push('Evaluación formativa con ticket de salida');
    activities.push('Actividad de metacognición: ¿qué aprendí hoy?');
  }

  return activities.slice(0, 5);
}

export function generateIndicators(oa: CurriculumOA): string[] {
  const desc = oa.description;
  return [
    `Demuestra comprensión del ${getOALabel(oa)} mediante ejemplos concretos`,
    `Relaciona los contenidos del objetivo con situaciones cotidianas`,
    `Comunica sus aprendizajes de forma oral y/o escrita con claridad`,
    `Aplica los conceptos trabajados en nuevos contextos o problemas`,
  ];
}

// ── Subject Grouping (for hub display) ──

const SUBJECT_GROUPS: Record<string, string[]> = {
  'Lenguaje y Comunicación': ['Lenguaje', 'Lenguaje y Comunicación', 'Lengua y Literatura', 'Lectura y Escritura Especializadas', 'Participación y argumentación en democracia'],
  'Historia y Ciencias Sociales': ['Historia', 'Historia, Geografía y Ciencias Sociales', 'Comprensión Histórica del Presente', 'Economía y Sociedad', 'Educación Ciudadana'],
  'Matemática': ['Matemática', 'Matemáticas', 'Límites, derivadas e integrales', 'Pensamiento Computacional y Programación'],
  'Ciencias': ['Ciencias Naturales', 'Ciencias para la Ciudadanía', 'Biología', 'Biología de los ecosistemas', 'Física', 'Química'],
  'Educación Física': ['Educación Física', 'Educación Física y Salud'],
  'Filosofía': ['Filosofía', 'Seminario Filosofía', 'Estética'],
};

export interface SubjectGroup {
  displayName: string;
  subjects: { slug: string; name: string; grades: string[]; oaCount: number }[];
  totalGrades: number;
  totalOAs: number;
}

export function getGroupedSubjects(): SubjectGroup[] {
  const data = loadCurriculum();
  const allSubjects = new Map<string, { name: string; grades: string[]; oaCount: number }>();

  for (const grade of Object.keys(data)) {
    for (const subject of Object.keys(data[grade])) {
      const slug = slugifySubject(subject);
      if (!allSubjects.has(slug)) {
        allSubjects.set(slug, { name: subject, grades: [], oaCount: 0 });
      }
      const entry = allSubjects.get(slug)!;
      entry.grades.push(grade);
      entry.oaCount += data[grade][subject].reduce((acc, u) => acc + u.oas.length, 0);
    }
  }

  // Build groups
  const grouped: SubjectGroup[] = [];
  const assigned = new Set<string>();

  for (const [displayName, members] of Object.entries(SUBJECT_GROUPS)) {
    const subjects: SubjectGroup['subjects'] = [];
    for (const [slug, info] of allSubjects) {
      if (members.includes(info.name)) {
        subjects.push({ slug, ...info });
        assigned.add(slug);
      }
    }
    if (subjects.length > 0) {
      grouped.push({
        displayName,
        subjects,
        totalGrades: new Set(subjects.flatMap(s => s.grades)).size,
        totalOAs: subjects.reduce((acc, s) => acc + s.oaCount, 0),
      });
    }
  }

  // Ungrouped subjects (standalone)
  for (const [slug, info] of allSubjects) {
    if (!assigned.has(slug)) {
      grouped.push({
        displayName: info.name,
        subjects: [{ slug, ...info }],
        totalGrades: info.grades.length,
        totalOAs: info.oaCount,
      });
    }
  }

  return grouped.sort((a, b) => b.totalOAs - a.totalOAs);
}

// ── Grade display helpers ──

export function formatGradeDisplay(grade: string): string {
  return grade; // "7° Básico" already display-ready
}

export function formatSubjectShort(subject: string): string {
  if (subject.length > 30) {
    // "Historia, Geografía y Ciencias Sociales" → "Historia y Cs. Sociales"
    return subject
      .replace('Historia, Geografía y Ciencias Sociales', 'Historia y Cs. Sociales')
      .replace('Ciencias Naturales', 'Cs. Naturales')
      .replace('Educación Física y Salud', 'Ed. Física')
      .replace('Educación Tecnológica', 'Ed. Tecnológica')
      .replace('Lengua y Literatura', 'Lenguaje');
  }
  return subject;
}
