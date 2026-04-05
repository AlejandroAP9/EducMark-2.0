import type { MetadataRoute } from 'next'
import { getAllOASlugs, getAllNivelSlugs, getAllSubjectSlugs } from '@/features/seo/lib/curriculumSEO'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://educmark.cl'

  const staticPages = [
    '',
    '/login',
    '/signup',
    '/features/generador-planificaciones',
    '/planificaciones-mineduc',
    '/generador-clases-chile',
    '/evaluaciones-automaticas',
    '/colegios',
    '/educmark-vs-chatgpt',
    '/educmark-vs-califica',
    '/educmark-vs-edugami',
    '/educmark-vs-teachy',
    '/educmark-vs-chatlpo',
    '/privacidad-escolar',
    '/blog',
    '/blog/planificar-clase-en-6-minutos',
    '/blog/5-errores-planificar-sin-alineacion-mineduc',
    '/blog/neuroeducacion-en-el-aula',
  ]

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path.startsWith('/blog') ? 0.7 : 0.8,
  }))

  // Programmatic SEO: /planificaciones hub
  const hubEntry: MetadataRoute.Sitemap = [{
    url: `${baseUrl}/planificaciones`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.9,
  }]

  // Subject hubs: /planificaciones/[asignatura]
  const subjectEntries: MetadataRoute.Sitemap = getAllSubjectSlugs().map(({ asignatura }) => ({
    url: `${baseUrl}/planificaciones/${asignatura}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  // Level pages: /planificaciones/[asignatura]/[nivel]
  const nivelEntries: MetadataRoute.Sitemap = getAllNivelSlugs().map(({ asignatura, nivel }) => ({
    url: `${baseUrl}/planificaciones/${asignatura}/${nivel}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // OA leaf pages: /planificaciones/[asignatura]/[nivel]/[oa]
  const oaEntries: MetadataRoute.Sitemap = getAllOASlugs().map(({ asignatura, nivel, oa }) => ({
    url: `${baseUrl}/planificaciones/${asignatura}/${nivel}/${oa}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticEntries, ...hubEntry, ...subjectEntries, ...nivelEntries, ...oaEntries]
}
