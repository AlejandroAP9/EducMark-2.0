import type { Metadata } from 'next'
import Script from 'next/script'
import { Toaster } from 'sonner'
import { AgentationWrapper } from '@/shared/components/AgentationWrapper'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'EducMark — Planifica clases con IA',
    template: '%s | EducMark',
  },
  description: 'Plataforma SaaS de IA para profesores chilenos. Genera planificaciones, presentaciones y evaluaciones alineadas al currículum MINEDUC.',
  keywords: 'IA educativa, profesores Chile, planificaciones MINEDUC, material didáctico, evaluación docente, inteligencia artificial educación',
  authors: [{ name: 'EducMark SpA' }],
  metadataBase: new URL('https://educmark.cl'),
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: 'https://educmark.cl',
    siteName: 'EducMark',
    title: 'EducMark — Planifica 10 Clases en 1 Hora',
    description: 'El primer Sistema Operativo de Gestión Pedagógica para docentes chilenos.',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EducMark — Planifica clases con IA',
    description: 'El primer Sistema Operativo de Gestión Pedagógica para docentes chilenos.',
    images: ['/images/og-image.jpg'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <AgentationWrapper />
        <Toaster richColors position="top-right" />

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-WR40H1HK29"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WR40H1HK29');
          `}
        </Script>

        {/* Facebook Pixel */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1910585767002532');
            fbq('track', 'PageView');
          `}
        </Script>
      </body>
    </html>
  )
}
