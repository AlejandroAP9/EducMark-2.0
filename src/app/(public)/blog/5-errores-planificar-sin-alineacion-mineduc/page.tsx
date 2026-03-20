import type { Metadata } from 'next';
import ErroresPlanificarMINEDUC from '@/features/blog/components/ErroresPlanificarMINEDUC';

export const metadata: Metadata = {
    title: '5 Errores Comunes al Planificar sin Alineación MINEDUC | EducMark Blog',
    description: 'Descubre los 5 errores más frecuentes que cometen los docentes chilenos al planificar sin alineación curricular MINEDUC y cómo evitarlos con herramientas de IA.',
    alternates: {
        canonical: 'https://educmark.cl/blog/5-errores-planificar-sin-alineacion-mineduc',
    },
};

export default function ErroresPlanificarMINEDUCPage() {
    return <ErroresPlanificarMINEDUC />;
}
