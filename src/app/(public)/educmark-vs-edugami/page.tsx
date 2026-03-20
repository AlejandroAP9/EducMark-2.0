import type { Metadata } from 'next';
import EducMarkVsEdugami from '@/features/seo/components/EducMarkVsEdugami';

export const metadata: Metadata = {
    title: 'EducMark vs Edugami para Profesores Chile | Comparación 2026',
    description: '¿Edugami o EducMark? Edugami es evaluación digital para matemáticas. EducMark genera planificación + PPT + quiz en todas las asignaturas alineadas al MINEDUC. Compara aquí.',
    alternates: {
        canonical: 'https://educmark.cl/educmark-vs-edugami',
    },
};

export default function EducMarkVsEdugamiPage() {
    return <EducMarkVsEdugami />;
}
