'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Calendar } from 'lucide-react';

export interface BlogPost {
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    category: string;
}

export const BLOG_POSTS: BlogPost[] = [
    {
        slug: 'planificar-clase-en-6-minutos',
        title: 'Cómo planificar una clase en 6 minutos con IA',
        excerpt: 'Descubre el método paso a paso que usan cientos de profesores chilenos para crear planificaciones alineadas al currículo MINEDUC en una fracción del tiempo.',
        date: '2026-03-14',
        readTime: '5 min',
        category: 'Productividad',
    },
    {
        slug: '5-errores-planificar-sin-alineacion-mineduc',
        title: '5 errores comunes al planificar sin alineación MINEDUC',
        excerpt: 'Planificar clases sin verificar la alineación curricular puede generar brechas en el aprendizaje. Conoce los errores más frecuentes y cómo evitarlos.',
        date: '2026-03-14',
        readTime: '4 min',
        category: 'Currículo',
    },
    {
        slug: 'neuroeducacion-en-el-aula',
        title: 'Neuroeducación en el aula: guía práctica para docentes',
        excerpt: 'La neuroeducación no es teoría abstracta. Aprende estrategias concretas basadas en cómo aprende el cerebro para aplicar en tu próxima clase.',
        date: '2026-03-14',
        readTime: '7 min',
        category: 'Neuroeducación',
    },
];

const BlogIndex: React.FC = () => {
    return (
        <div className="bg-[var(--background)] min-h-screen">
            
            {/* Navbar */}
            <nav className="border-b border-white/[0.06] bg-[var(--card)]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <a href="/" className="font-bold text-xl text-foreground hover:opacity-80 transition-opacity">
                        EducMark
                    </a>
                    <Link href="/login?tab=register" className="text-sm text-primary hover:opacity-80 transition-opacity font-medium">
                        Probar Gratis
                    </Link>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <header className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold font-heading text-foreground tracking-tight mb-4">
                        Blog EducMark
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Recursos, guías y estrategias para docentes que quieren planificar mejor y recuperar su tiempo.
                    </p>
                </header>

                <div className="space-y-6">
                    {BLOG_POSTS.map((post) => (
                        <Link
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            className="block rounded-2xl border border-white/[0.06] bg-card/50 p-6 md:p-8 hover:border-primary/30 hover:bg-card/80 transition-all group"
                        >
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium border border-primary/20">
                                    {post.category}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {new Date(post.date).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {post.readTime}
                                </span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                {post.title}
                            </h2>
                            <p className="text-muted-foreground leading-relaxed mb-3">
                                {post.excerpt}
                            </p>
                            <span className="text-sm text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                Leer artículo <ArrowRight size={14} />
                            </span>
                        </Link>
                    ))}
                </div>
            </main>

            <footer className="border-t border-white/[0.06] py-10 px-6 text-center">
                <p className="text-muted-foreground text-sm">
                    &copy; {new Date().getFullYear()} EducMark Chile &middot; <a href="/" className="text-primary hover:underline">Volver al inicio</a>
                </p>
            </footer>
        </div>
    );
};

export default BlogIndex;
