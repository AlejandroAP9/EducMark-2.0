import Link from 'next/link';
import {
  generateActivities,
  generateIndicators,
  formatSubjectShort,
  getOALabel,
} from '@/features/seo/lib/curriculumSEO';

interface OALandingProps {
  grade: string;
  subject: string;
  unit: { name: string; oas: { label?: string; id?: string; description: string }[] };
  oa: { label?: string; id?: string; description: string };
  unitIndex: number;
  siblingOAs: { label: string; slug: string }[];
  totalOAsInLevel: number;
  asignaturaSlug: string;
  nivelSlug: string;
}

export default function OALanding({
  grade,
  subject,
  unit,
  oa,
  unitIndex,
  siblingOAs,
  totalOAsInLevel,
  asignaturaSlug,
  nivelSlug,
}: OALandingProps) {
  const activities = generateActivities(oa, subject, grade);
  const indicators = generateIndicators(oa);
  const subjectShort = formatSubjectShort(subject);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <Link
            href="/"
            className="font-bold text-xl text-gray-900 hover:opacity-80 transition-opacity"
          >
            EducMark
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[#8B5CF6] hover:text-[#7C3AED] transition-colors"
          >
            Iniciar sesion
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 md:py-16">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
            <li>
              <Link href="/planificaciones-mineduc" className="hover:text-[#8B5CF6] transition-colors">
                Planificaciones
              </Link>
            </li>
            <li aria-hidden="true">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li>
              <Link
                href={`/planificaciones/${asignaturaSlug}`}
                className="hover:text-[#8B5CF6] transition-colors"
              >
                {subjectShort}
              </Link>
            </li>
            <li aria-hidden="true">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li>
              <Link
                href={`/planificaciones/${asignaturaSlug}/${nivelSlug}`}
                className="hover:text-[#8B5CF6] transition-colors"
              >
                {grade}
              </Link>
            </li>
            <li aria-hidden="true">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li className="text-gray-900 font-medium">{getOALabel(oa)}</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <header className="mb-12">
          <span className="inline-block bg-[#8B5CF6]/10 text-[#8B5CF6] px-3 py-1 rounded-full text-xs font-semibold mb-4">
            Unidad {unitIndex + 1}: {unit.name}
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-3">
            Planificacion para {getOALabel(oa)}
          </h1>
          <p className="text-lg text-gray-600">
            {subject} — {grade}
          </p>
        </header>

        {/* OA Description */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Objetivo de Aprendizaje</h2>
          <blockquote className="border-l-4 border-[#8B5CF6] bg-gray-50 rounded-r-xl px-6 py-5 text-gray-700 leading-relaxed">
            <span className="font-semibold text-gray-900">{getOALabel(oa)}:</span>{' '}
            {oa.description}
          </blockquote>
        </section>

        {/* Actividades Sugeridas */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Actividades Sugeridas</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {activities.map((activity, i) => (
              <div
                key={i}
                className="flex gap-3 items-start rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <span className="shrink-0 w-8 h-8 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <p className="text-gray-700 text-sm leading-relaxed">{activity}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Indicadores de Evaluacion */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Indicadores de Evaluacion</h2>
          <ul className="space-y-3">
            {indicators.map((indicator, i) => (
              <li key={i} className="flex gap-3 items-start">
                <svg
                  className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 text-sm leading-relaxed">{indicator}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA Section */}
        <section className="text-center py-12 px-6 rounded-2xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/[0.04] mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Genera esta planificacion completa en 6 minutos
          </h2>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            EducMark crea la planificacion, presentacion y quiz alineados a este OA.
            Todo listo para tu clase.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mb-8">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              PPT incluido
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Quiz incluido
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Pauta incluida
            </span>
          </div>
          <Link
            href="/login?tab=register"
            className="inline-flex items-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold py-3.5 px-8 rounded-full transition-colors text-lg"
          >
            Crear Planificacion Gratis
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="text-gray-400 text-sm mt-3">3 clases gratis · Sin tarjeta</p>
        </section>

        {/* Related OAs */}
        {siblingOAs.length > 1 && (
          <section className="mb-14">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Otros objetivos de {subjectShort} en {grade}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {totalOAsInLevel} objetivos de aprendizaje en este nivel
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {siblingOAs
                .filter((s) => s.slug !== `${asignaturaSlug}/${nivelSlug}/${s.slug}` && s.label !== `${getOALabel(oa)} — ${unit.name.split(':')[0]}`)
                .slice(0, 12)
                .map((sibling) => (
                  <Link
                    key={sibling.slug}
                    href={`/planificaciones/${asignaturaSlug}/${nivelSlug}/${sibling.slug}`}
                    className="block rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 hover:border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/[0.02] transition-colors"
                  >
                    {sibling.label}
                  </Link>
                ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-6 text-center">
        <p className="text-gray-400 text-sm">
          EducMark &copy; {new Date().getFullYear()} &middot; Hecho en Chile para profesores chilenos
        </p>
      </footer>
    </div>
  );
}
