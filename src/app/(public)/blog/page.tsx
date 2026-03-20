import type { Metadata } from 'next';
import BlogIndex from '@/features/blog/components/BlogIndex';

export const metadata: Metadata = {
    title: 'Blog EducMark | Recursos para Docentes Chilenos',
    description: 'Artículos, guías y recursos para profesores chilenos. Planificación con IA, neuroeducación, currículo MINEDUC y productividad docente.',
    alternates: {
        canonical: 'https://educmark.cl/blog',
    },
};

export default function BlogPage() {
    return <BlogIndex />;
}
