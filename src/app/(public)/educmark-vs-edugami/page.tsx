import type { Metadata } from 'next';
import EducMarkVsEdugami from '@/features/seo/components/EducMarkVsEdugami';

export const metadata: Metadata = {
    title: 'EducMark vs Edugami para Profesores Chile | Comparación 2026',
    description: '¿Edugami o EducMark? Edugami es evaluación digital para matemáticas. EducMark genera planificación + PPT + quiz en todas las asignaturas alineadas al MINEDUC en 6 minutos. Compara aquí.',
    alternates: {
        canonical: 'https://educmark.cl/educmark-vs-edugami',
    },
    openGraph: {
        title: 'EducMark vs Edugami — Comparación para Profesores Chilenos',
        description: '¿Edugami o EducMark? Compara evaluación digital vs ciclo pedagógico completo alineado al MINEDUC.',
        url: 'https://educmark.cl/educmark-vs-edugami',
        siteName: 'EducMark',
        type: 'article',
    },
};

export default function EducMarkVsEdugamiPage() {
    return <EducMarkVsEdugami />;
}
