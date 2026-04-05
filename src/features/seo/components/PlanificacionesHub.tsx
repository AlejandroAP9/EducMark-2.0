import Link from 'next/link';
import {
  loadCurriculum,
  getAllSubjectSlugs,
  slugifySubject,
  slugifyGrade,
  formatSubjectShort,
} from '@/features/seo/lib/curriculumSEO';

function getSubjectData() {
  const data = loadCurriculum();
  const slugs = getAllSubjectSlugs();

  return slugs.map(({ asignatura }) => {
    const grades: string[] = [];
    let fullName = '';
    let oaCount = 0;

    for (const grade of Object.keys(data)) {
      for (const subject of Object.keys(data[grade])) {
        if (slugifySubject(subject) === asignatura) {
          fullName = subject;
          grades.push(grade);
          const units = data[grade][subject];
          oaCount += units.reduce((acc, u) => acc + u.oas.length, 0);
        }
      }
    }

    return {
      slug: asignatura,
      name: fullName,
      shortName: formatSubjectShort(fullName),
      gradeCount: grades.length,
      oaCount,
    };
  });
}

export default function PlanificacionesHub() {
  const subjects = getSubjectData();
  const totalOAs = subjects.reduce((acc, s) => acc + s.oaCount, 0);

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
        {/* Hero */}
        <header className="text-center mb-16">
          <span className="inline-block bg-[#8B5CF6]/10 text-[#8B5CF6] px-4 py-1.5 rounded-full text-sm font-semibold border border-[#8B5CF6]/20 mb-6">
            Curriculo Nacional Vigente
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Planificaciones alineadas al{' '}
            <span className="text-[#8B5CF6]">Curriculo MINEDUC</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {totalOAs.toLocaleString('es-CL')}+ objetivos de aprendizaje cubiertos.
            Selecciona una asignatura para explorar los niveles y OA disponibles.
          </p>
        </header>

        {/* Subject Grid */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Asignaturas disponibles
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map((subject) => (
              <Link
                key={subject.slug}
                href={`/planificaciones/${subject.slug}`}
                className="group rounded-2xl border border-gray-200 bg-gray-50 p-6 hover:border-[#8B5CF6]/40 hover:shadow-md transition-all"
              >
                <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-[#8B5CF6] transition-colors">
                  {subject.shortName}
                </h3>
                {subject.shortName !== subject.name && (
                  <p className="text-xs text-gray-400 mb-3">{subject.name}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{subject.gradeCount} niveles</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>{subject.oaCount} OA</span>
                </div>
                <div className="mt-4 text-[#8B5CF6] text-sm font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver niveles
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 px-6 rounded-3xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/5">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Genera planificaciones completas en minutos
          </h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            Planificacion + presentacion + quiz, todo alineado al OA que necesitas.
            3 clases gratis, sin tarjeta.
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
          <Link href="/" className="text-[#8B5CF6] hover:underline">Volver al inicio</Link>
        </p>
      </footer>
    </div>
  );
}
