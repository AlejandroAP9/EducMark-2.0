import type { Metadata } from 'next';
import PlanificarClase6Min from '@/features/blog/components/PlanificarClase6Min';

export const metadata: Metadata = {
    title: 'Cómo planificar una clase en 6 minutos con IA | EducMark Blog',
    description: 'Método paso a paso para crear planificaciones de clase alineadas al currículo MINEDUC en 6 minutos usando inteligencia artificial. Guía para profesores chilenos.',
    alternates: {
        canonical: 'https://educmark.cl/blog/planificar-clase-en-6-minutos',
    },
};

export default function PlanificarClase6MinPage() {
    return <PlanificarClase6Min />;
}
