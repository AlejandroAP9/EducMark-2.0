import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAllSubjectSlugs,
  getSubjectDisplayNames,
} from '@/features/seo/lib/curriculumSEO';
import AsignaturaHub from '@/features/seo/components/AsignaturaHub';

interface Props {
  params: Promise<{ asignatura: string }>;
}

export async function generateStaticParams() {
  return getAllSubjectSlugs();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { asignatura } = await params;
  const { subjects } = getSubjectDisplayNames(asignatura);

  if (subjects.length === 0) return {};

  const displayName = subjects[0];

  return {
    title: `${displayName} — Planificaciones MINEDUC | EducMark`,
    description: `Planificaciones de ${displayName} alineadas al curriculo MINEDUC. Todos los niveles y objetivos de aprendizaje disponibles para generar con IA.`,
    alternates: {
      canonical: `/planificaciones/${asignatura}`,
    },
  };
}

export default async function AsignaturaPage({ params }: Props) {
  const { asignatura } = await params;
  const { subjects } = getSubjectDisplayNames(asignatura);

  if (subjects.length === 0) notFound();

  return <AsignaturaHub asignaturaSlug={asignatura} />;
}
