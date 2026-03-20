import type { Metadata } from 'next';
import EvaluacionesAutomaticas from '@/features/seo/components/EvaluacionesAutomaticas';

export const metadata: Metadata = {
    title: 'Corrección Automática de Pruebas OMR | Escáner con Celular | EducMark',
    description: 'Corrige pruebas automáticamente con tu celular. Escáner OMR, análisis de ítems, retroalimentación pedagógica por IA. Para profesores chilenos. Prueba gratis.',
    alternates: {
        canonical: 'https://educmark.cl/evaluaciones-automaticas',
    },
};

export default function EvaluacionesAutomaticasPage() {
    return <EvaluacionesAutomaticas />;
}
