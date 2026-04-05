import Link from 'next/link';
import {
  loadCurriculum,
  slugifySubject,
  slugifyGrade,
  formatSubjectShort,
} from '@/features/seo/lib/curriculumSEO';

interface AsignaturaHubProps {
  asignaturaSlug: string;
}

function getAsignaturaData(asigSlug: string) {
  const data = loadCurriculum();
  let subjectName = '';
  const grades: { grade: string; slug: string; oaCount: number }[] = [];

  for (const grade of Object.keys(data)) {
    for (const subject of Object.keys(data[grade])) {
      if (slugifySubject(subject) === asigSlug) {
        subjectName = subject;
        const units = data[grade][subject];
        const oaCount = units.reduce((acc, u) => acc + u.oas.length, 0);
        grades.push({
          grade,
          slug: slugifyGrade(grade),
          oaCount,
        });
      }
    }
  }

  return { subjectName, grades };
}

export default function AsignaturaHub({ asignaturaSlug }: AsignaturaHubProps) {
  const { subjectName, grades } = getAsignaturaData(asignaturaSlug);
  const totalOAs = grades.reduce((acc, g) => acc + g.oaCount, 0);
  const shortName = formatSubjectShort(subjectName);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navbar */}
      <nav className="border-b border-white/[0.06] bg-[var(--card)]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <Link href="/" className="font-bold text-xl text-foreground hover:opacity-80 transition-opacity">
            EducMark
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center px-5 py-2 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Iniciar Sesion
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-muted-foreground flex items-center gap-2">
          <Link href="/planificaciones" className="hover:text-[#8B5CF6] transition-colors">
            Planificaciones
          </Link>
          <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-foreground font-medium">{shortName}</span>
        </nav>

        {/* Hero */}
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-heading leading-tight mb-4">
            <span className="text-foreground">Planificaciones de</span>{' '}
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">{shortName}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Selecciona el nivel para ver los objetivos de aprendizaje disponibles.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>{grades.length} niveles</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>{totalOAs} OA en total</span>
          </div>
        </header>

        {/* Grade Grid */}
        <section className="mb-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {grades.map((g) => (
              <Link
                key={g.slug}
                href={`/planificaciones/${asignaturaSlug}/${g.slug}`}
                className="group rounded-2xl border border-white/[0.06] bg-[var(--card)]/50 p-6 hover:border-[#8B5CF6]/30 hover:bg-[var(--card)]/80 transition-all text-center"
              >
                <h3 className="font-bold text-foreground text-xl mb-2 group-hover:text-[#8B5CF6] transition-colors">
                  {g.grade}
                </h3>
                <p className="text-sm text-muted-foreground">{g.oaCount} objetivos de aprendizaje</p>
                <div className="mt-4 text-[#8B5CF6] text-sm font-semibold flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver OA
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 px-6 rounded-3xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/[0.04]">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Planifica {shortName} en minutos
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            EducMark genera planificacion + presentacion + quiz alineados al OA que elijas.
            De profe a profe.
          </p>
          <Link
            href="/login?tab=register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white text-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Probar Gratis
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="text-muted-foreground/60 text-sm mt-3">3 clases gratis · Sin tarjeta de credito</p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-6 text-center">
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} EducMark Chile ·{' '}
          <Link href="/planificaciones" className="text-[#8B5CF6] hover:underline">Todas las asignaturas</Link>
          {' · '}
          <Link href="/" className="text-[#8B5CF6] hover:underline">Inicio</Link>
        </p>
      </footer>
    </div>
  );
}
