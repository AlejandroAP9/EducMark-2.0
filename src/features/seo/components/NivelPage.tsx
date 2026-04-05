import Link from 'next/link';
import {
  loadCurriculum,
  slugifySubject,
  slugifyGrade,
  slugifyOA,
  formatSubjectShort,
  getOALabel,
  type CurriculumUnit,
} from '@/features/seo/lib/curriculumSEO';

interface NivelPageProps {
  asignaturaSlug: string;
  nivelSlug: string;
}

function getNivelData(asigSlug: string, nivelSlug: string) {
  const data = loadCurriculum();
  let subjectName = '';
  let gradeName = '';
  let units: CurriculumUnit[] = [];

  for (const grade of Object.keys(data)) {
    if (slugifyGrade(grade) !== nivelSlug) continue;
    for (const subject of Object.keys(data[grade])) {
      if (slugifySubject(subject) !== asigSlug) continue;
      subjectName = subject;
      gradeName = grade;
      units = data[grade][subject];
    }
  }

  const totalOAs = units.reduce((acc, u) => acc + u.oas.length, 0);
  return { subjectName, gradeName, units, totalOAs };
}

export default function NivelPage({ asignaturaSlug, nivelSlug }: NivelPageProps) {
  const { subjectName, gradeName, units, totalOAs } = getNivelData(asignaturaSlug, nivelSlug);
  const shortName = formatSubjectShort(subjectName);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <Link href="/" className="font-bold text-xl text-gray-900 hover:opacity-80 transition-opacity">
            EducMark
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center px-5 py-2 rounded-full bg-[#8B5CF6] text-white text-sm font-semibold hover:bg-[#7C3AED] transition-colors"
          >
            Iniciar Sesion
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-gray-500 flex items-center gap-2 flex-wrap">
          <Link href="/planificaciones" className="hover:text-[#8B5CF6] transition-colors">
            Planificaciones
          </Link>
          <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <Link href={`/planificaciones/${asignaturaSlug}`} className="hover:text-[#8B5CF6] transition-colors">
            {shortName}
          </Link>
          <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">{gradeName}</span>
        </nav>

        {/* Hero */}
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Planificaciones de {shortName}
            <br />
            <span className="text-[#8B5CF6]">{gradeName}</span>
          </h1>
          <span className="inline-block bg-[#8B5CF6]/10 text-[#8B5CF6] px-4 py-1.5 rounded-full text-sm font-semibold border border-[#8B5CF6]/20 mt-4">
            {totalOAs} objetivos de aprendizaje
          </span>
        </header>

        {/* Units with OA cards */}
        <section className="mb-20 space-y-12">
          {units.map((unit, unitIndex) => (
            <div key={unitIndex}>
              <h2 className="text-xl font-bold text-gray-900 mb-5 pb-3 border-b border-gray-200">
                {unit.name}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {unit.oas.map((oa, oaIndex) => {
                  const oaSlug = slugifyOA(oa, unitIndex);
                  const truncatedDesc =
                    oa.description.length > 100
                      ? oa.description.slice(0, 100) + '...'
                      : oa.description;

                  return (
                    <Link
                      key={oaIndex}
                      href={`/planificaciones/${asignaturaSlug}/${nivelSlug}/${oaSlug}`}
                      className="group rounded-xl border border-gray-200 bg-gray-50 p-5 hover:border-[#8B5CF6]/40 hover:shadow-md transition-all"
                    >
                      <span className="inline-block bg-[#8B5CF6]/10 text-[#8B5CF6] px-2.5 py-0.5 rounded-md text-xs font-bold mb-2">
                        {getOALabel(oa)}
                      </span>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {truncatedDesc}
                      </p>
                      <div className="mt-3 text-[#8B5CF6] text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver planificacion
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="text-center py-12 px-6 rounded-3xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/5">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Genera estas planificaciones automaticamente
          </h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            Selecciona cualquier OA y EducMark genera planificacion + presentacion + quiz
            en minutos. Alineado a las Bases Curriculares.
          </p>
          <Link
            href="/login?tab=register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#8B5CF6] text-white text-lg font-semibold hover:bg-[#7C3AED] transition-colors"
          >
            Probar Gratis
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="text-gray-400 text-sm mt-3">3 clases gratis · Sin tarjeta de credito</p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-10 px-6 text-center">
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} EducMark Chile ·{' '}
          <Link href={`/planificaciones/${asignaturaSlug}`} className="text-[#8B5CF6] hover:underline">{shortName}</Link>
          {' · '}
          <Link href="/planificaciones" className="text-[#8B5CF6] hover:underline">Todas las asignaturas</Link>
          {' · '}
          <Link href="/" className="text-[#8B5CF6] hover:underline">Inicio</Link>
        </p>
      </footer>
    </div>
  );
}
