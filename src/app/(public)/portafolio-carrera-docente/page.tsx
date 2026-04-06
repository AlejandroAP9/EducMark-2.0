import type { Metadata } from 'next';
import PortafolioCarreraDocente from '@/features/seo/components/PortafolioCarreraDocente';

export const metadata: Metadata = {
    title: 'Portafolio Carrera Docente 2025 con IA | EducMark Chile',
    description:
        'Genera los borradores del Módulo 1 del Portafolio Docentemás 2025 con IA. Tareas 1, 2 y 3 redactadas con los datos reales de tus clases, apuntando a Competente/Destacado de las rúbricas oficiales de CPEIP.',
    keywords: [
        'portafolio carrera docente',
        'portafolio docentemas 2025',
        'módulo 1 portafolio docente',
        'evaluación docente chile',
        'rúbricas CPEIP 2025',
        'tarea 1 portafolio',
        'tarea 2 evaluación formativa',
        'tarea 3 reflexión socioemocional',
        'carrera docente IA',
    ],
    alternates: {
        canonical: 'https://educmark.cl/portafolio-carrera-docente',
    },
    openGraph: {
        title: 'Portafolio Carrera Docente 2025 con IA | EducMark Chile',
        description:
            'Genera los borradores del Módulo 1 del Portafolio Docentemás 2025 en minutos. Tareas 1, 2 y 3 redactadas con tus datos reales.',
        url: 'https://educmark.cl/portafolio-carrera-docente',
        siteName: 'EducMark',
        locale: 'es_CL',
        type: 'website',
    },
};

export default function PortafolioCarreraDocentePage() {
    return <PortafolioCarreraDocente />;
}
