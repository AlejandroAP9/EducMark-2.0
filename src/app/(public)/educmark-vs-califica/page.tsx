import type { Metadata } from 'next';
import EducMarkVsCalifica from '@/features/seo/components/EducMarkVsCalifica';

export const metadata: Metadata = {
    title: 'EducMark vs Califica para Profesores Chile | Comparación 2026',
    description: '¿Califica o EducMark? Califica genera recursos para 5 países LATAM. EducMark tiene RAG con Bases Curriculares MINEDUC, genera plan + PPT + quiz en 6 minutos y ofrece NEE/DUA. Compara aquí.',
    alternates: {
        canonical: 'https://educmark.cl/educmark-vs-califica',
    },
    openGraph: {
        title: 'EducMark vs Califica — Comparación para Profesores Chilenos',
        description: '¿Califica o EducMark? Compara profundidad curricular MINEDUC, flujo integrado y adaptaciones NEE/DUA.',
        url: 'https://educmark.cl/educmark-vs-califica',
        siteName: 'EducMark',
        type: 'article',
    },
};

export default function EducMarkVsCalificaPage() {
    return <EducMarkVsCalifica />;
}
