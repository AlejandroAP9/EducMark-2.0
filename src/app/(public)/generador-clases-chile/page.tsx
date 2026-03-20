import type { Metadata } from 'next';
import GeneradorClasesChile from '@/features/seo/components/GeneradorClasesChile';

export const metadata: Metadata = {
    title: 'Generador de Clases con IA para Chile | Currículum MINEDUC | EducMark',
    description: 'Genera clases completas alineadas al currículum chileno en 6 minutos. Planificación + PPT + Quiz con IA. 2.000+ OA, neuroeducación, NEE/DUA. Prueba gratis.',
    alternates: {
        canonical: 'https://educmark.cl/generador-clases-chile',
    },
};

export default function GeneradorClasesChilePage() {
    return <GeneradorClasesChile />;
}
