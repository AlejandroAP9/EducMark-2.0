import type { Metadata } from 'next';
import PortafolioCarreraDocente from '@/features/seo/components/PortafolioCarreraDocente';

const SITE_URL = 'https://educmark.cl';
const PAGE_URL = `${SITE_URL}/portafolio-carrera-docente`;

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: '¿Esto reemplaza al portafolio oficial de docentemas.cl?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'No. EducMark genera los borradores de texto del Módulo 1 (Tareas 1, 2 y 3). Tú los revisas, los ajustas con tu voz y los copias en docentemas.cl. El portafolio oficial siempre lo subes tú.',
            },
        },
        {
            '@type': 'Question',
            name: '¿De dónde saca los datos la IA?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'De tus clases generadas en EducMark. Cada vez que generas una planificación, EducMark guarda los datos reales (objetivo, inicio, desarrollo, cierre, evaluación formativa, NEE, DUA, PACI). Cuando vas a generar borradores del portafolio, la IA usa esa información real, no la inventa.',
            },
        },
        {
            '@type': 'Question',
            name: '¿Apunta a nivel Competente o Destacado?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Los prompts están construidos apuntando al nivel Competente/Destacado de las Rúbricas 2025 de CPEIP. Usan el lenguaje exacto de los indicadores oficiales.',
            },
        },
        {
            '@type': 'Question',
            name: '¿Cubre los 3 módulos del portafolio?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'No. Solo el Módulo 1 (3 tareas de texto). El Módulo 2 (clase grabada) y el Módulo 3 (evaluación escrita del conocimiento) no son automatizables — son presenciales o de aplicación individual.',
            },
        },
        {
            '@type': 'Question',
            name: '¿Cuántas clases necesito tener generadas?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Seleccionas hasta 3 experiencias de aprendizaje del semestre. La IA usa esas 3 clases reales más sus datos de planificación, evaluación y NEE como fuente primaria.',
            },
        },
    ],
};

const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
        {
            '@type': 'ListItem',
            position: 1,
            name: 'Inicio',
            item: SITE_URL,
        },
        {
            '@type': 'ListItem',
            position: 2,
            name: 'Portafolio Carrera Docente',
            item: PAGE_URL,
        },
    ],
};

const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'EducMark — Portafolio Carrera Docente',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    url: PAGE_URL,
    description:
        'Genera los borradores del Módulo 1 del Portafolio Docentemás 2025 con IA. Tareas 1, 2 y 3 redactadas con los datos reales de tus clases, apuntando a Competente/Destacado de las rúbricas oficiales de CPEIP.',
    inLanguage: 'es-CL',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'CLP',
        description: '3 clases gratis para comenzar. Sin tarjeta.',
    },
    provider: {
        '@type': 'Organization',
        name: 'EducMark',
        url: SITE_URL,
    },
    audience: {
        '@type': 'EducationalAudience',
        educationalRole: 'teacher',
    },
};

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
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
            />
            <PortafolioCarreraDocente />
        </>
    );
}
