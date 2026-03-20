import type { Metadata } from 'next';
import PrivacidadEscolar from '@/features/seo/components/PrivacidadEscolar';

export const metadata: Metadata = {
    title: 'Privacidad y Seguridad de Datos Escolares | EducMark',
    description: 'Cómo EducMark protege los datos de tu colegio. Cumplimiento Ley 19.628, cifrado SSL/TLS, aislamiento por establecimiento (RLS), sin datos de estudiantes. Infraestructura SOC 2 Type II.',
    alternates: {
        canonical: 'https://educmark.cl/privacidad-escolar',
    },
};

export default function PrivacidadEscolarPage() {
    return <PrivacidadEscolar />;
}
