import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAllNivelSlugs,
  findBySlug,
  loadCurriculum,
  formatSubjectShort,
} from '@/features/seo/lib/curriculumSEO';
import NivelPage from '@/features/seo/components/NivelPage';

interface Props {
  params: Promise<{ asignatura: string; nivel: string }>;
}

export async function generateStaticParams() {
  return getAllNivelSlugs();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { asignatura, nivel } = await params;
  const data = loadCurriculum();
  const result = findBySlug(data, asignatura, nivel);

  if (!result) return {};

  const shortName = formatSubjectShort(result.subject);

  return {
    title: `${shortName} ${result.grade} — Planificaciones MINEDUC | EducMark`,
    description: `${result.totalOAsInLevel} objetivos de aprendizaje de ${result.subject} para ${result.grade}. Planificaciones alineadas al curriculo MINEDUC generadas con IA.`,
    alternates: {
      canonical: `/planificaciones/${asignatura}/${nivel}`,
    },
  };
}

export default async function NivelRoute({ params }: Props) {
  const { asignatura, nivel } = await params;
  const data = loadCurriculum();
  const result = findBySlug(data, asignatura, nivel);

  if (!result) notFound();

  return <NivelPage asignaturaSlug={asignatura} nivelSlug={nivel} />;
}
