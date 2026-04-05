import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getAllOASlugs,
  loadCurriculum,
  findBySlug,
  getOALabel,
} from '@/features/seo/lib/curriculumSEO';
import OALanding from '@/features/seo/components/OALanding';

interface PageProps {
  params: Promise<{ asignatura: string; nivel: string; oa: string }>;
}

export function generateStaticParams() {
  return getAllOASlugs();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { asignatura, nivel, oa } = await params;
  const data = loadCurriculum();
  const resolved = findBySlug(data, asignatura, nivel, oa);

  if (!resolved) {
    return { title: 'OA no encontrado | EducMark' };
  }

  const title = `Planificacion ${getOALabel(resolved.oa)} — ${resolved.subject} ${resolved.grade} | EducMark`;
  const description = `Genera una planificacion de clase para ${getOALabel(resolved.oa)} de ${resolved.subject} en ${resolved.grade}. ${resolved.oa.description.slice(0, 140)}`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://educmark.cl/planificaciones/${asignatura}/${nivel}/${oa}`,
    },
  };
}

export default async function OAPage({ params }: PageProps) {
  const { asignatura, nivel, oa } = await params;
  const data = loadCurriculum();
  const resolved = findBySlug(data, asignatura, nivel, oa);

  if (!resolved) {
    notFound();
  }

  return (
    <OALanding
      grade={resolved.grade}
      subject={resolved.subject}
      unit={resolved.unit}
      oa={resolved.oa}
      unitIndex={resolved.unitIndex}
      siblingOAs={resolved.siblingOAs}
      totalOAsInLevel={resolved.totalOAsInLevel}
      asignaturaSlug={asignatura}
      nivelSlug={nivel}
    />
  );
}
