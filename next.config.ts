import type { NextConfig } from 'next'

const cspPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.sentry.io https://www.googletagmanager.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com https://www.googletagmanager.com https://www.facebook.com https://educmark-supabase.vfuqpl.easypanel.host https://*.vfuqpl.easypanel.host https://tempfile.aiquickdraw.com https://replicate.delivery https://pbxt.replicate.delivery",
  "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://educmark-supabase.vfuqpl.easypanel.host https://assessment-api.vfuqpl.easypanel.host https://n8n.educmark.cl https://*.sentry.io https://*.ingest.us.sentry.io https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://connect.facebook.net https://www.facebook.com",
  "media-src 'self' https://*.supabase.co",
  "frame-src 'self' https://www.mercadopago.cl",
].join('; ')

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    mcpServer: true,
  },
  serverExternalPackages: ['jspdf', 'jspdf-autotable', 'docx', 'fflate'],

  // n8n webhook proxy (replaces Vite proxy config)
  async rewrites() {
    return [
      {
        source: '/api/webhook/:path*',
        destination: 'https://n8n.educmark.cl/webhook/:path*',
      },
    ]
  },

  // Security & caching headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspPolicy,
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
