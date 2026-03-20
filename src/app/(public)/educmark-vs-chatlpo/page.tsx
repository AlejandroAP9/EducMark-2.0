import type { Metadata } from 'next';
import EducMarkVsChatLPO from '@/features/seo/components/EducMarkVsChatLPO';

export const metadata: Metadata = {
    title: 'EducMark vs ChatLPO para Profesores Chile | Comparación 2026',
    description: '¿ChatLPO o EducMark? ChatLPO ofrece 30+ herramientas sueltas. EducMark genera plan + PPT + quiz en un flujo integrado de 6 minutos por $13.900/mes. Compara aquí.',
    alternates: {
        canonical: 'https://educmark.cl/educmark-vs-chatlpo',
    },
    openGraph: {
        title: 'EducMark vs ChatLPO — Comparación para Profesores Chilenos',
        description: '¿ChatLPO o EducMark? Compara herramientas sueltas vs flujo integrado, precios y alineación MINEDUC.',
        url: 'https://educmark.cl/educmark-vs-chatlpo',
        siteName: 'EducMark',
        type: 'article',
    },
};

export default function EducMarkVsChatLPOPage() {
    return <EducMarkVsChatLPO />;
}
