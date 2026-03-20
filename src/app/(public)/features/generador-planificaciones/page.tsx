import type { Metadata } from 'next';
import LessonGeneratorLanding from '@/features/seo/components/LessonGeneratorLanding';

export const metadata: Metadata = {
    title: 'Generador de Planificaciones de Clase con IA | EducMark Chile',
    description: 'Crea planificaciones de clase alineadas al currículum nacional chileno (MINEDUC) en segundos. Incluye objetivos OA, indicadores y actividades DUA.',
    alternates: {
        canonical: 'https://educmark.cl/features/generador-planificaciones',
    },
};

export default function GeneradorPlanificacionesPage() {
    return <LessonGeneratorLanding />;
}
