'use client';

/**
 * Curriculum Coverage View — PL-05
 * Shows UTP which OAs have been planned by each teacher vs total available.
 */
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { generateSemesterCoverageReport } from '@/shared/lib/generateReport';
import { useInstitutionBranding } from '@/shared/hooks/useInstitutionBranding';

interface TeacherCoverage {
    userId: string;
    fullName: string;
    subject: string;
    grade: string;
    plannedOAs: string[];
    totalClasses: number;
}

export const CurriculumCoverage: React.FC = () => {
    const supabase = createClient();
    const { logo, institutionName, primaryColor } = useInstitutionBranding();
    const branding = { logo, institutionName, primaryColor };
    const [coverage, setCoverage] = useState<TeacherCoverage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCoverage();
    }, []);

    const fetchCoverage = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Get institution from user profile
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('institution')
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (!profile?.institution) {
                setCoverage([]);
                return;
            }

            // Get all teachers from same institution
            const { data: teachers } = await supabase
                .from('user_profiles')
                .select('user_id, full_name')
                .eq('institution', profile.institution);

            if (!teachers || teachers.length === 0) { setCoverage([]); return; }

            const teacherIds = teachers.map(t => t.user_id);
            const teacherMap = new Map(teachers.map(t => [t.user_id, t.full_name || 'Sin nombre']));

            // Get all generated classes from these teachers (last 6 months)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const { data: classes } = await supabase
                .from('generated_classes')
                .select('user_id, asignatura, curso, topic, objetivo_clase')
                .in('user_id', teacherIds)
                .gte('created_at', sixMonthsAgo.toISOString());

            if (!classes) { setCoverage([]); return; }

            // Group by teacher + subject + grade
            const groupMap = new Map<string, TeacherCoverage>();

            classes.forEach(cls => {
                const key = `${cls.user_id}::${cls.asignatura}::${cls.curso}`;
                if (!groupMap.has(key)) {
                    groupMap.set(key, {
                        userId: cls.user_id,
                        fullName: teacherMap.get(cls.user_id) || 'Sin nombre',
                        subject: cls.asignatura || 'Sin asignatura',
                        grade: cls.curso || 'Sin curso',
                        plannedOAs: [],
                        totalClasses: 0,
                    });
                }
                const group = groupMap.get(key)!;
                group.totalClasses++;
                // Extract OA from topic/objective
                const oaMatch = (cls.topic || cls.objetivo_clase || '').match(/OA\s*\d+/gi);
                if (oaMatch) {
                    oaMatch.forEach((oa: string) => {
                        if (!group.plannedOAs.includes(oa.toUpperCase())) {
                            group.plannedOAs.push(oa.toUpperCase());
                        }
                    });
                }
            });

            setCoverage(Array.from(groupMap.values()).sort((a, b) => a.fullName.localeCompare(b.fullName)));
        } catch (err) {
            console.error('Error fetching coverage:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-[var(--muted)]">Cargando cobertura curricular...</div>;
    }

    if (coverage.length === 0) {
        return (
            <div className="glass-card-premium p-8 text-center">
                <BookOpen size={32} className="text-[var(--muted)] mx-auto mb-3 opacity-40" />
                <p className="text-[var(--muted)]">No hay datos de cobertura curricular disponibles.</p>
            </div>
        );
    }

    return (
        <div className="glass-card-premium p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[var(--on-background)] flex items-center gap-2">
                    <BookOpen size={20} className="text-[var(--primary)]" />
                    Cobertura Curricular por Profesor
                </h3>
                <button
                    onClick={() => {
                        const semester = `Semestre ${new Date().getMonth() < 7 ? '1' : '2'} - ${new Date().getFullYear()}`;
                        generateSemesterCoverageReport('Instituci\u00f3n', semester, coverage, branding);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--on-background)] transition-colors"
                >
                    <Download size={14} /> Reporte PDF
                </button>
            </div>

            <div className="space-y-3">
                {coverage.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]/40">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <span className="font-semibold text-[var(--on-background)]">{item.fullName}</span>
                                <span className="text-xs text-[var(--muted)] ml-2">{item.subject} &bull; {item.grade}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {item.plannedOAs.length >= 5 ? (
                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                ) : (
                                    <AlertTriangle size={16} className="text-amber-400" />
                                )}
                                <span className="text-sm font-bold text-[var(--on-background)]">
                                    {item.plannedOAs.length} OA planificados
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {item.plannedOAs.map(oa => (
                                <span key={oa} className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs rounded-full border border-[var(--primary)]/20 font-medium">
                                    {oa}
                                </span>
                            ))}
                            {item.plannedOAs.length === 0 && (
                                <span className="text-xs text-[var(--muted)]">Sin OA identificados en planificaciones</span>
                            )}
                        </div>
                        <p className="text-xs text-[var(--muted)] mt-2">{item.totalClasses} clases planificadas</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
