import Link from 'next/link';
import { getGroupedSubjects } from '@/features/seo/lib/curriculumSEO';

export default function PlanificacionesHub() {
  const groups = getGroupedSubjects();
  const totalOAs = groups.reduce((acc, g) => acc + g.totalOAs, 0);

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
        {/* Hero */}
        <header className="text-center mb-16">
          <span className="inline-block bg-[#8B5CF6]/10 text-[#8B5CF6] px-4 py-1.5 rounded-full text-sm font-semibold border border-[#8B5CF6]/20 mb-6">
            Curriculo Nacional Vigente
          </span>
          <h1 className="text-4xl md:text-5xl font-bold font-heading leading-tight mb-4">
            <span className="text-foreground">Planificaciones alineadas al</span>{' '}
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">Curriculo MINEDUC</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {totalOAs.toLocaleString('es-CL')}+ objetivos de aprendizaje cubiertos.
            Selecciona una asignatura para explorar los niveles y OA disponibles.
          </p>
        </header>

        {/* Subject Groups */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Asignaturas disponibles
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map((group) => (
              <div
                key={group.displayName}
                className="rounded-2xl border border-white/[0.06] bg-[var(--card)]/50 p-6 hover:border-[#8B5CF6]/30 hover:bg-[var(--card)]/80 transition-all"
              >
                <h3 className="font-bold text-foreground text-lg mb-3">
                  {group.displayName}
                </h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span>{group.totalGrades} niveles</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>{group.totalOAs} OA</span>
                </div>

                {/* Links to individual subjects */}
                <div className="space-y-1.5">
                  {group.subjects.map((subject) => (
                    <Link
                      key={subject.slug}
                      href={`/planificaciones/${subject.slug}`}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.04] text-sm text-muted-foreground hover:text-[#8B5CF6] transition-all group"
                    >
                      <span>{subject.name}</span>
                      <span className="text-xs opacity-60">{subject.grades.length} niveles</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 px-6 rounded-3xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/[0.04]">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Genera planificaciones completas en minutos
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Planificacion + presentacion + quiz, todo alineado al OA que necesitas.
            3 clases gratis, sin tarjeta.
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
          <Link href="/" className="text-[#8B5CF6] hover:underline">Volver al inicio</Link>
        </p>
      </footer>
    </div>
  );
}
