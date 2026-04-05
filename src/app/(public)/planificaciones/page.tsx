import type { Metadata } from 'next';
import PlanificacionesHub from '@/features/seo/components/PlanificacionesHub';

export const metadata: Metadata = {
  title: 'Planificaciones por Asignatura — Curriculo MINEDUC | EducMark',
  description:
    'Explora planificaciones de clase alineadas a las Bases Curriculares del MINEDUC. Todas las asignaturas, niveles y objetivos de aprendizaje de 1° Basico a 4° Medio.',
  alternates: {
    canonical: '/planificaciones',
  },
};

export default function PlanificacionesPage() {
  return <PlanificacionesHub />;
}
