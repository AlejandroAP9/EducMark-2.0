'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, Save, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface SettingsForm {
    institution: string;
    license_status: 'active' | 'paused' | 'expired' | 'trial';
    license_expires_at: string;
    branding_logo_url: string;
    branding_primary_color: string;
    academic_period: string;
    academic_period_start: string;
    academic_period_end: string;
    grade_min: string;
    grade_max: string;
    grade_pass: string;
    help_email: string;
    help_whatsapp: string;
}

interface SubRow {
    plan_type: string | null;
    status: string | null;
}

export function InstitutionSettings() {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [memberIds, setMemberIds] = useState<string[]>([]);
    const [subscriptionSummary, setSubscriptionSummary] = useState<{ active: number; paused: number; expired: number; byPlan: Record<string, number> }>({
        active: 0,
        paused: 0,
        expired: 0,
        byPlan: {},
    });
    const [form, setForm] = useState<SettingsForm>({
        institution: '',
        license_status: 'trial',
        license_expires_at: '',
        branding_logo_url: '',
        branding_primary_color: '#a48fff',
        academic_period: 'Semestre 1',
        academic_period_start: '',
        academic_period_end: '',
        grade_min: '1.0',
        grade_max: '7.0',
        grade_pass: '4.0',
        help_email: '',
        help_whatsapp: '',
    });

    const canSave = useMemo(() => form.institution.trim().length > 0, [form.institution]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const { data: authData } = await supabase.auth.getUser();
            const userId = authData?.user?.id;
            if (!userId) return;

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('institution')
                .eq('user_id', userId)
                .maybeSingle();

            const institution = profile?.institution || '';
            if (!institution) {
                setForm((prev) => ({ ...prev, institution: '' }));
                return;
            }

            const { data: members } = await supabase
                .from('user_profiles')
                .select('user_id')
                .eq('institution', institution);

            const ids = (members || []).map((m: { user_id: string }) => m.user_id).filter(Boolean);
            setMemberIds(ids);

            if (ids.length > 0) {
                const { data: subs } = await supabase
                    .from('user_subscriptions')
                    .select('plan_type, status')
                    .in('user_id', ids);

                const active = (subs || []).filter((s: SubRow) => s.status === 'active').length;
                const paused = (subs || []).filter((s: SubRow) => s.status === 'paused').length;
                const expired = (subs || []).filter((s: SubRow) => s.status === 'expired' || s.status === 'cancelled').length;
                const byPlan: Record<string, number> = {};
                (subs || []).forEach((s: SubRow) => {
                    const key = (s.plan_type || 'trial').toLowerCase();
                    byPlan[key] = (byPlan[key] || 0) + 1;
                });
                setSubscriptionSummary({ active, paused, expired, byPlan });
            }

            const { data: existing } = await supabase
                .from('institution_settings')
                .select('*')
                .eq('institution', institution)
                .maybeSingle();

            if (existing) {
                const scale = (existing.grading_scale || {}) as { min?: number; max?: number; pass?: number };
                setForm({
                    institution,
                    license_status: (existing.license_status || 'trial') as SettingsForm['license_status'],
                    license_expires_at: existing.license_expires_at ? String(existing.license_expires_at).slice(0, 10) : '',
                    branding_logo_url: existing.branding_logo_url || '',
                    branding_primary_color: existing.branding_primary_color || '#a48fff',
                    academic_period: existing.academic_period || 'Semestre 1',
                    academic_period_start: (existing.academic_period_dates as any)?.start || '',
                    academic_period_end: (existing.academic_period_dates as any)?.end || '',
                    grade_min: String(scale.min ?? 1.0),
                    grade_max: String(scale.max ?? 7.0),
                    grade_pass: String(scale.pass ?? 4.0),
                    help_email: existing.help_email || '',
                    help_whatsapp: existing.help_whatsapp || '',
                });
            } else {
                setForm((prev) => ({ ...prev, institution }));
            }
        } catch (error) {
            console.error('Error loading institution settings:', error);
            toast.error('No se pudo cargar la configuración institucional.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const saveSettings = async () => {
        if (!canSave) return;
        setSaving(true);
        try {
            const { data: authData } = await supabase.auth.getUser();
            const userId = authData?.user?.id;

            const payload = {
                institution: form.institution.trim(),
                managed_by: userId,
                license_status: form.license_status,
                license_expires_at: form.license_expires_at ? new Date(form.license_expires_at).toISOString() : null,
                branding_logo_url: form.branding_logo_url.trim() || null,
                branding_primary_color: form.branding_primary_color || '#a48fff',
                academic_period: form.academic_period.trim() || 'Semestre 1',
                academic_period_dates: {
                    start: form.academic_period_start || null,
                    end: form.academic_period_end || null,
                },
                grading_scale: {
                    min: Number(form.grade_min || 1),
                    max: Number(form.grade_max || 7),
                    pass: Number(form.grade_pass || 4),
                },
                help_email: form.help_email.trim() || null,
                help_whatsapp: form.help_whatsapp.trim() || null,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('institution_settings')
                .upsert(payload, { onConflict: 'institution' });

            if (error) throw error;
            toast.success('Configuración institucional guardada.');
        } catch (error) {
            console.error('Error saving institution settings:', error);
            toast.error('No se pudo guardar la configuración.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="glass-card-premium p-8">Cargando configuración institucional...</div>;
    }

    return (
        <div className="space-y-5">
            <button onClick={() => router.push('/dashboard/admin')} className="admin-back-btn">
                <ArrowLeft size={18} />
                Volver
            </button>

            <div className="admin-page-header">
                <div className="header-icon"><Building2 size={22} /></div>
                <div>
                    <h1>Configuración Institucional</h1>
                    <p>Licencia, branding, periodos y escala por defecto</p>
                </div>
            </div>

            <div className="admin-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-label">Usuarios Institución</div>
                    <div className="kpi-value">{memberIds.length}</div>
                </div>
                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-label">Licencias Activas</div>
                    <div className="kpi-value">{subscriptionSummary.active}</div>
                </div>
                <div className="glass-card-premium admin-kpi-card">
                    <div className="kpi-label">Licencias Expiradas/Canceladas</div>
                    <div className="kpi-value">{subscriptionSummary.expired}</div>
                </div>
            </div>

            <div className="glass-card-premium p-6" style={{ borderRadius: '1rem' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm mb-1 text-[var(--muted)]">Institución</label>
                        <input
                            value={form.institution}
                            onChange={(e) => setForm((prev) => ({ ...prev, institution: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-[var(--muted)]">Estado licencia</label>
                        <select
                            value={form.license_status}
                            onChange={(e) => setForm((prev) => ({ ...prev, license_status: e.target.value as SettingsForm['license_status'] }))}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]"
                        >
                            <option value="active">Activa</option>
                            <option value="paused">Pausada</option>
                            <option value="expired">Expirada</option>
                            <option value="trial">Trial</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-[var(--muted)]">Vencimiento licencia</label>
                        <input
                            type="date"
                            value={form.license_expires_at}
                            onChange={(e) => setForm((prev) => ({ ...prev, license_expires_at: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-[var(--muted)]">Periodo académico por defecto</label>
                        <input
                            value={form.academic_period}
                            onChange={(e) => setForm((prev) => ({ ...prev, academic_period: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]"
                            placeholder="Ej: Semestre 1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-[var(--muted)]">Inicio del periodo</label>
                        <input
                            type="date"
                            value={form.academic_period_start}
                            onChange={(e) => setForm((prev) => ({ ...prev, academic_period_start: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-[var(--muted)]">Término del periodo</label>
                        <input
                            type="date"
                            value={form.academic_period_end}
                            onChange={(e) => setForm((prev) => ({ ...prev, academic_period_end: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-[var(--muted)]">Logo institucional (URL)</label>
                        <input
                            value={form.branding_logo_url}
                            onChange={(e) => setForm((prev) => ({ ...prev, branding_logo_url: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]"
                            placeholder="https://..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-[var(--muted)]">Color primario branding</label>
                        <input
                            value={form.branding_primary_color}
                            onChange={(e) => setForm((prev) => ({ ...prev, branding_primary_color: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]"
                            placeholder="#a48fff"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-[var(--muted)]">Escala mín.</label>
                        <input
                            value={form.grade_min}
                            onChange={(e) => setForm((prev) => ({ ...prev, grade_min: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-[var(--muted)]">Escala máx.</label>
                        <input
                            value={form.grade_max}
                            onChange={(e) => setForm((prev) => ({ ...prev, grade_max: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-[var(--muted)]">Nota aprobación</label>
                        <input
                            value={form.grade_pass}
                            onChange={(e) => setForm((prev) => ({ ...prev, grade_pass: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-[var(--muted)]">Email soporte</label>
                        <input
                            value={form.help_email}
                            onChange={(e) => setForm((prev) => ({ ...prev, help_email: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-[var(--muted)]">WhatsApp soporte</label>
                        <input
                            value={form.help_whatsapp}
                            onChange={(e) => setForm((prev) => ({ ...prev, help_whatsapp: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={saveSettings}
                        disabled={!canSave || saving}
                        className="btn-gradient px-4 py-2 rounded-lg text-white flex items-center gap-2 disabled:opacity-60"
                    >
                        <Save size={16} />
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </div>

            <div className="glass-card-premium p-5" style={{ borderRadius: '1rem' }}>
                <h3 className="font-semibold text-[var(--on-background)] mb-2 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[var(--primary)]" />
                    Distribución por plan (institución)
                </h3>
                <div className="text-sm text-[var(--muted)]">
                    {Object.keys(subscriptionSummary.byPlan).length === 0 && 'Sin datos de planes para esta institución.'}
                    {Object.entries(subscriptionSummary.byPlan).map(([plan, count]) => (
                        <div key={plan}>{plan}: <strong className="text-[var(--on-background)]">{count}</strong></div>
                    ))}
                </div>
            </div>
        </div>
    );
}

