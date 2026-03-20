import type { Metadata } from 'next';
import EducMarkVsTeachy from '@/features/seo/components/EducMarkVsTeachy';

export const metadata: Metadata = {
    title: 'EducMark vs Teachy para Profesores Chile | Comparación 2026',
    description: '¿Teachy o EducMark? Teachy es brasileña con currículum BNCC. EducMark tiene RAG MINEDUC, genera plan + PPT + quiz, cobra en CLP y ofrece NEE/DUA. Compara aquí.',
    alternates: {
        canonical: 'https://educmark.cl/educmark-vs-teachy',
    },
};

export default function EducMarkVsTeachyPage() {
    return <EducMarkVsTeachy />;
}
