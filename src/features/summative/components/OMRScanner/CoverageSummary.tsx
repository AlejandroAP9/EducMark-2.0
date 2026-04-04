'use client';

import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export const CoverageSummary: React.FC<{ evaluationId: string }> = ({ evaluationId }) => {
    const supabase = createClient();
    const [coverage, setCoverage] = useState<{ total: number; scanned: number; missing: { name: string; rut: string }[]; avgScore: number; passRate: number } | null>(null);

    useEffect(() => {
        if (!evaluationId) return;
        const load = async () => {
            try {
                const { data: evalData } = await supabase.from('evaluations').select('grade').eq('id', evaluationId).single();
                if (!evalData?.grade) return;

                const { data: students } = await supabase.from('students').select('id, first_name, last_name, rut').eq('course_grade', evalData.grade);
                if (!students || students.length === 0) return;

                const { data: results } = await supabase.from('omr_results').select('student_id, score').eq('evaluation_id', evaluationId);
                const scannedIds = new Set((results || []).map((r: { student_id: string | null }) => r.student_id).filter(Boolean));

                const missing = students
                    .filter(s => !scannedIds.has(String(s.id)))
                    .map(s => ({ name: `${s.first_name} ${s.last_name}`, rut: s.rut || '' }));

                const scores = (results || []).map((r: { score: { percentage: number } }) => r.score?.percentage ?? 0);
                const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
                const passRate = scores.length > 0 ? Math.round((scores.filter((s: number) => s >= 60).length / scores.length) * 100) : 0;

                setCoverage({ total: students.length, scanned: scannedIds.size, missing, avgScore, passRate });
            } catch (err) {
                console.error('Error loading coverage:', err);
            }
        };
        load();
    }, [evaluationId]);

    if (!coverage || coverage.total === 0) return null;

    const pct = Math.round((coverage.scanned / coverage.total) * 100);
    const allScanned = coverage.missing.length === 0;

    return (
        <div className={`glass-card-premium p-6 border ${allScanned ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>
            <h3 className="text-lg font-bold text-[var(--on-background)] mb-3 flex items-center gap-2">
                <Users size={18} className={allScanned ? 'text-emerald-400' : 'text-amber-400'} />
                Cobertura de Escaneo
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="text-center p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]">
                    <p className="text-2xl font-bold text-[var(--on-background)]">{coverage.scanned}/{coverage.total}</p>
                    <p className="text-xs text-[var(--muted)]">Escaneados</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]">
                    <p className="text-2xl font-bold text-[var(--on-background)]">{pct}%</p>
                    <p className="text-xs text-[var(--muted)]">Cobertura</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]">
                    <p className="text-2xl font-bold text-[var(--on-background)]">{coverage.avgScore}%</p>
                    <p className="text-xs text-[var(--muted)]">Promedio</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]">
                    <p className="text-2xl font-bold text-[var(--on-background)]">{coverage.passRate}%</p>
                    <p className="text-xs text-[var(--muted)]">Aprobacion</p>
                </div>
            </div>

            {!allScanned && (
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                    <p className="text-sm font-bold text-amber-300 mb-2">Alumnos sin escanear ({coverage.missing.length})</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                        {coverage.missing.map((m, i) => (
                            <p key={i} className="text-xs text-amber-200/80">- {m.name} {m.rut && `(${m.rut})`}</p>
                        ))}
                    </div>
                </div>
            )}
            {allScanned && (
                <p className="text-sm text-emerald-300 font-medium">Todos los alumnos han sido escaneados.</p>
            )}

            <div className="w-full h-2 bg-[var(--input-bg)] rounded-full overflow-hidden mt-3">
                <div
                    className={`h-full rounded-full transition-all ${allScanned ? 'bg-emerald-500' : 'bg-amber-400'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};
