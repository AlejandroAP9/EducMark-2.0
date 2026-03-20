/**
 * Audit Log Utility — AD-15
 * Logs user actions to the audit_logs table for activity tracking.
 */
import { createClient } from '@/lib/supabase/client';

export async function logAuditEvent(event: string, details?: Record<string, unknown>): Promise<void> {
    try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase.from('audit_logs').insert({
            user_id: session.user.id,
            event,
            details: details || {},
            created_at: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Audit log error:', err);
    }
}
