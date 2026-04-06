import type { Metadata } from 'next';
import PreparePortafolioDocentemas from '@/features/blog/components/PreparePortafolioDocentemas';

const PAGE_URL = 'https://educmark.cl/blog/como-preparar-portafolio-docentemas-2025';

const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Cómo preparar el Portafolio Docentemás 2025 sin perder tus fines de semana',
    description:
        'Guía paso a paso para abordar el Módulo 1 del Portafolio de Carrera Docente 2025 con los documentos oficiales de CPEIP y cómo usar los datos de tus clases para redactar los borradores en minutos.',
    image: 'https://educmark.cl/images/og-default.jpg',
    datePublished: '2026-04-06',
    dateModified: '2026-04-06',
    author: {
        '@type': 'Organization',
        name: 'EducMark',
        url: 'https://educmark.cl',
    },
    publisher: {
        '@type': 'Organization',
        name: 'EducMark',
        logo: {
            '@type': 'ImageObject',
            url: 'https://educmark.cl/images/logo.png',
        },
    },
    mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': PAGE_URL,
    },
    inLanguage: 'es-CL',
    keywords:
        'portafolio docentemas 2025, carrera docente, módulo 1 portafolio, rúbricas CPEIP, evaluación docente chile',
};

export const metadata: Metadata = {
    title: 'Cómo preparar el Portafolio Docentemás 2025 | EducMark Blog',
    description:
        'Guía paso a paso para abordar el Módulo 1 del Portafolio de Carrera Docente 2025 con los documentos oficiales de CPEIP. Tareas 1, 2 y 3 explicadas con claves para Competente/Destacado.',
    alternates: {
        canonical: PAGE_URL,
    },
    openGraph: {
        title: 'Cómo preparar el Portafolio Docentemás 2025 sin perder tus fines de semana',
        description:
            'Guía paso a paso del Módulo 1 del Portafolio de Carrera Docente 2025. Tareas 1, 2 y 3 explicadas con las rúbricas oficiales de CPEIP.',
        url: PAGE_URL,
        siteName: 'EducMark',
        locale: 'es_CL',
        type: 'article',
    },
};

export default function PreparePortafolioDocentemasPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <PreparePortafolioDocentemas />
        </>
    );
}
