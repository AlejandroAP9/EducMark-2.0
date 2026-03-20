import type { Metadata } from 'next';
import EducMarkVsTeachy from '@/features/seo/components/EducMarkVsTeachy';

export const metadata: Metadata = {
    title: 'EducMark vs Teachy para Profesores Chile | Comparación 2026',
    description: '¿Teachy o EducMark? Teachy es brasileña con currículum BNCC. EducMark tiene RAG MINEDUC, genera plan + PPT + quiz en 6 minutos, cobra en CLP y ofrece NEE/DUA. Compara aquí.',
    alternates: {
        canonical: 'https://educmark.cl/educmark-vs-teachy',
    },
    openGraph: {
        title: 'EducMark vs Teachy — Comparación para Profesores Chilenos',
        description: '¿Teachy o EducMark? Compara currículum BNCC vs MINEDUC, precios en CLP y adaptaciones NEE/DUA.',
        url: 'https://educmark.cl/educmark-vs-teachy',
        siteName: 'EducMark',
        type: 'article',
    },
};

export default function EducMarkVsTeachyPage() {
    return <EducMarkVsTeachy />;
}
