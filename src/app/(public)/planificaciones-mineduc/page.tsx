import type { Metadata } from 'next';
import PlanificacionesMINEDUC from '@/features/seo/components/PlanificacionesMINEDUC';

export const metadata: Metadata = {
    title: 'Generador de Planificaciones MINEDUC con IA | EducMark Chile',
    description: 'Genera planificaciones de clase alineadas a las Bases Curriculares MINEDUC en 6 minutos. 2.000+ OA indexados, desde 1° Básico a IV° Medio. Incluye PPT y quiz. Gratis.',
    alternates: {
        canonical: 'https://educmark.cl/planificaciones-mineduc',
    },
};

export default function PlanificacionesMINEDUCPage() {
    return <PlanificacionesMINEDUC />;
}
