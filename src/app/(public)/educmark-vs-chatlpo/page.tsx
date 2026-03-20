import type { Metadata } from 'next';
import EducMarkVsChatLPO from '@/features/seo/components/EducMarkVsChatLPO';

export const metadata: Metadata = {
    title: 'EducMark vs ChatLPO para Profesores Chile | Comparación 2026',
    description: '¿ChatLPO o EducMark? ChatLPO cuesta $25.000/mes con herramientas sueltas. EducMark genera plan + PPT + quiz en 4 minutos por $13.900/mes. Compara aquí.',
    alternates: {
        canonical: 'https://educmark.cl/educmark-vs-chatlpo',
    },
};

export default function EducMarkVsChatLPOPage() {
    return <EducMarkVsChatLPO />;
}
