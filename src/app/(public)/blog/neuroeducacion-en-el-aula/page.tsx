import type { Metadata } from 'next';
import NeuroeducacionAula from '@/features/blog/components/NeuroeducacionAula';

export const metadata: Metadata = {
    title: 'Neuroeducación en el Aula: Guía Práctica para Docentes | EducMark Blog',
    description: 'Guía práctica de neuroeducación para docentes chilenos: ciclos de atención, inicio emocional, estrategias concretas, DUA y cómo aplicar la ciencia del cerebro en tu aula.',
    alternates: {
        canonical: 'https://educmark.cl/blog/neuroeducacion-en-el-aula',
    },
};

export default function NeuroeducacionAulaPage() {
    return <NeuroeducacionAula />;
}
