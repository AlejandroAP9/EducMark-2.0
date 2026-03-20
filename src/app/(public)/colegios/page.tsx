import type { Metadata } from 'next';
import ColegiosLanding from '@/features/seo/components/ColegiosLanding';

export const metadata: Metadata = {
    title: 'EducMark para Colegios | Plan Establecimiento | Licencias Docentes',
    description: 'Plan institucional EducMark para colegios chilenos. Desde 10 licencias docentes con plan Cóndor completo, panel UTP, reportes de cobertura curricular y retroalimentación pedagógica IA. Desde $150.000/mes.',
    alternates: {
        canonical: 'https://educmark.cl/colegios',
    },
};

export default function ColegiosPage() {
    return <ColegiosLanding />;
}
