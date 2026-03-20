import type { Metadata } from 'next';
import EducMarkVsChatGPT from '@/features/seo/components/EducMarkVsChatGPT';

export const metadata: Metadata = {
    title: 'EducMark vs ChatGPT para Profesores Chile | Comparación 2026',
    description: '¿ChatGPT o EducMark para planificar clases en Chile? Compara: alineación MINEDUC, OA reales, formato UTP, corrección OMR. EducMark genera planificación + presentación + quiz en 6 minutos.',
    alternates: {
        canonical: 'https://educmark.cl/educmark-vs-chatgpt',
    },
};

export default function EducMarkVsChatGPTPage() {
    return <EducMarkVsChatGPT />;
}
