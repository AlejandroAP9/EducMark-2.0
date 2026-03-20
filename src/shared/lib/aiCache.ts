import { createClient } from '@/lib/supabase/client';

/**
 * Generates a SHA-256 hash from a JSON object.
 */
export async function generateCacheKey(params: Record<string, unknown>): Promise<string> {
    const canonicalString = JSON.stringify(params, Object.keys(params).sort());
    const msgBuffer = new TextEncoder().encode(canonicalString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Checks if a response exists in the cache for the given hash.
 */
export async function checkAICache(hash: string) {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('ai_cache')
            .select('response')
            .eq('prompt_hash', hash)
            .maybeSingle();

        if (error) {
            console.warn('Cache check error:', error);
            return null;
        }
        return data?.response || null;
    } catch (err) {
        console.error('Unexpected cache error:', err);
        return null;
    }
}

/**
 * Saves a response to the cache.
 */
export async function saveToAICache(hash: string, params: Record<string, unknown>, response: unknown) {
    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('ai_cache')
            .insert({ prompt_hash: hash, params, response });

        if (error) console.warn('Cache save error:', error);
    } catch (err) {
        console.error('Unexpected cache save error:', err);
    }
}
