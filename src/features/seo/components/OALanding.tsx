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
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navbar */}
      <nav className="border-b border-white/[0.06] bg-[var(--card)]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <Link
            href="/"
            className="font-bold text-xl text-foreground hover:opacity-80 transition-opacity"
          >
            EducMark
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center px-5 py-2 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Iniciar sesion
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 md:py-16">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
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
            <li className="text-foreground font-medium">{getOALabel(oa)}</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <header className="mb-12">
          <span className="inline-block bg-[#8B5CF6]/10 text-[#8B5CF6] px-3 py-1 rounded-full text-xs font-semibold mb-4">
            Unidad {unitIndex + 1}: {unit.name}
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading leading-tight tracking-tight mb-3 text-foreground">
            Planificacion para {getOALabel(oa)}
          </h1>
          <p className="text-lg text-muted-foreground">
            {subject} — {grade}
          </p>
        </header>

        {/* OA Description */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-4">Objetivo de Aprendizaje</h2>
          <blockquote className="border-l-4 border-l-[#8B5CF6] bg-[var(--card)]/50 border-y border-r border-white/[0.06] rounded-r-xl px-6 py-5 text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">{getOALabel(oa)}:</span>{' '}
            {oa.description}
          </blockquote>
        </section>

        {/* Actividades Sugeridas */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-6">Actividades Sugeridas</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {activities.map((activity, i) => (
              <div
                key={i}
                className="flex gap-3 items-start rounded-xl border border-white/[0.06] bg-[var(--card)]/50 p-4"
              >
                <span className="shrink-0 w-8 h-8 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <p className="text-muted-foreground text-sm leading-relaxed">{activity}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Indicadores de Evaluacion */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-6">Indicadores de Evaluacion</h2>
          <ul className="space-y-3">
            {indicators.map((indicator, i) => (
              <li key={i} className="flex gap-3 items-start">
                <svg
                  className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-muted-foreground text-sm leading-relaxed">{indicator}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA Section */}
        <section className="text-center py-12 px-6 rounded-2xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/[0.04] mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Genera esta planificacion completa en 6 minutos
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            EducMark crea la planificacion, presentacion y quiz alineados a este OA.
            Todo listo para tu clase.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-8">
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
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] hover:opacity-90 text-white font-semibold py-3.5 px-8 rounded-full transition-opacity text-lg"
          >
            Crear Planificacion Gratis
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="text-muted-foreground/60 text-sm mt-3">3 clases gratis · Sin tarjeta</p>
        </section>

        {/* Related OAs */}
        {siblingOAs.length > 1 && (
          <section className="mb-14">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Otros objetivos de {subjectShort} en {grade}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
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
                    className="block rounded-lg border border-white/[0.06] bg-[var(--card)]/50 px-4 py-3 text-sm text-muted-foreground hover:border-[#8B5CF6]/30 hover:bg-[var(--card)]/80 transition-all"
                  >
                    {sibling.label}
                  </Link>
                ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6 text-center">
        <p className="text-muted-foreground text-sm">
          EducMark &copy; {new Date().getFullYear()} &middot; Hecho en Chile para profesores chilenos
        </p>
      </footer>
    </div>
  );
}
