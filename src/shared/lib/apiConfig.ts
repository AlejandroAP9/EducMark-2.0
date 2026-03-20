import { createClient } from '@/lib/supabase/client';

/**
 * Returns the base URL for the Assessment API.
 *
 * Priority:
 *  1. NEXT_PUBLIC_ASSESSMENT_API_URL env var (production / dev explicit)
 *  2. When the env var points to localhost and the page is served from a
 *     different host (mobile dev, LAN), map to that host:8000
 *  3. Fallback to the production API
 */
export function getAssessmentApiUrl(): string {
    let url = process.env.NEXT_PUBLIC_ASSESSMENT_API_URL || 'https://assessment-api.vfuqpl.easypanel.host';
    if (url.includes('localhost') && typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
        if (hostname !== 'localhost') {
            url = isIp || hostname.includes('local')
                ? `${window.location.protocol}//${hostname}:8000`
                : window.location.origin;
        }
    }
    return url;
}

/**
 * Returns the Authorization header with the current Supabase JWT.
 * Falls back to an empty object if there's no active session.
 */
export async function getAssessmentAuthHeaders(): Promise<Record<string, string>> {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
}

/**
 * fetch wrapper that automatically injects the Supabase Bearer token.
 */
export async function assessmentFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const authHeaders = await getAssessmentAuthHeaders();
    return fetch(input, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...(init.headers as Record<string, string> | undefined),
        },
    });
}

/**
 * Triggers the n8n onboarding email sequence for a new signup.
 * Fire-and-forget — errors are silently ignored.
 */
export function triggerOnboardingEmails(name: string, email: string): void {
    fetch('https://n8n.educmark.cl/webhook/onboarding-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
    }).catch(() => {}); // best-effort, don't block signup
}
