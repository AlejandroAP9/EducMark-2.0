/**
 * Resolve the public-facing origin from a Next.js server request, even when
 * behind a reverse proxy (Easypanel/nginx/traefik).
 *
 * Problem: new URL(request.url).origin returns 0.0.0.0:80 inside Docker
 * because Next.js reads the raw Host header from the container bind, not
 * the upstream proxy. That breaks OAuth redirects, magic-link callbacks,
 * and anything server-side that builds absolute URLs.
 *
 * Priority:
 *   1. x-forwarded-host + x-forwarded-proto (set by Easypanel/nginx)
 *   2. NEXT_PUBLIC_SITE_URL env var (deterministic fallback)
 *   3. request.url (works in dev, broken in containers)
 */
export function getPublicOrigin(request: Request): string {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto');

    if (forwardedHost) {
        const proto = forwardedProto || 'https';
        return `${proto}://${forwardedHost}`;
    }

    const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (envUrl && !envUrl.includes('0.0.0.0') && !envUrl.includes('localhost:80')) {
        return envUrl.replace(/\/+$/, '');
    }

    return new URL(request.url).origin;
}
