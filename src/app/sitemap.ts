import type { MetadataRoute } from 'next'

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

  return staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path.startsWith('/blog') ? 0.7 : 0.8,
  }))
}
