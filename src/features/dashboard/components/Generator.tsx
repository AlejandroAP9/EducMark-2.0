'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Check, Info, Clock, Save, FolderOpen, Trash2,
    ArrowRight, Sparkles, Zap, Wand2, GraduationCap,
    CheckCircle2, Users, TrendingUp, X, History
} from 'lucide-react';
import { Button, Tooltip } from '@/shared/components/ui/UIComponents';
import { motion, AnimatePresence } from 'framer-motion';
import { SUBJECTS, ELECTIVES_LIST, GRADES } from '@/shared/constants/curriculum';
import {
    useGenerator,
    NEE_OPTIONS,
    DURATIONS,
} from '@/features/dashboard/hooks/useGenerator';
import { fetchUnitsStatic } from '@/shared/lib/staticCurriculum';
import { useSubscriptionStore } from '@/features/auth/store/subscriptionStore';
import { createClient } from '@/lib/supabase/client';

export function Generator() {
    const supabase = createClient();
    const {
        step,
        formData,
        credits,
        isElectiveSelected,
        generating,
        loadingStage,
        loadingProgress,
        elapsedTime,
        currentTip,
        loadingMessages,
        educationalTips,
        updateField,
        setSelectedOAs,
        handleNext,
        handlePrev,
        handleGenerate,
        formatTime,
        saveDraft,
        loadDraft,
        deleteDraft,
        drafts,
        activeDraftId,
    } = useGenerator();
    const { plan, credits: subCredits, classesLimit } = useSubscriptionStore();
    const [oaOptions, setOaOptions] = useState<Array<{ code: string; description: string; unit: string; indicators: string[] }>>([]);
    const [loadingOAs, setLoadingOAs] = useState(false);
    const [oaSearchQuery, setOaSearchQuery] = useState('');
    const [draftName, setDraftName] = useState('');
    const [showUpsell, setShowUpsell] = useState(false);
    const [suggestedOAs, setSuggestedOAs] = useState<string[]>([]);

    // 6.16 — Show upsell when credits are exhausted
    useEffect(() => {
        if (credits !== null && credits <= 0 && plan !== 'condor') {
            setShowUpsell(true);
        }
    }, [credits, plan]);

    useEffect(() => {
        const loadOAs = async () => {
            if (!formData.grade || !formData.subject) {
                setOaOptions([]);
                return;
            }

            setLoadingOAs(true);
            try {
                const units = await fetchUnitsStatic(formData.grade, formData.subject);
                const unique = new Map<string, { code: string; description: string; unit: string; indicators: string[] }>();

                units.forEach((unit) => {
                    unit.oas.forEach((oa) => {
                        const rawCode = (oa.id || oa.label || '').toString().trim();
                        const normalizedCode = rawCode.replace(/^OA\s*/i, '').trim();
                        if (!normalizedCode) return;
                        const key = `${normalizedCode}::${oa.description || ''}`;
                        const indicators = (oa.description || '')
                            .split(/[.;]/)
                            .map((item) => item.trim())
                            .filter((item) => item.length > 20)
                            .slice(0, 3);
                        if (!unique.has(key)) {
                            unique.set(key, {
                                code: normalizedCode,
                                description: oa.description || '',
                                unit: unit.name,
                                indicators,
                            });
                        }
                    });
                });

                setOaOptions(Array.from(unique.values()));
            } catch (err) {
                console.error('Error loading OA options:', err);
                setOaOptions([]);
            } finally {
                setLoadingOAs(false);
            }
        };

        loadOAs();
    }, [formData.grade, formData.subject]);

    // Fetch user's most-used OAs for this subject+grade
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!formData.grade || !formData.subject) {
                setSuggestedOAs([]);
                return;
            }
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const { data } = await supabase
                    .from('generated_classes')
                    .select('objetivo_clase')
                    .eq('user_id', session.user.id)
                    .eq('asignatura', formData.subject)
                    .eq('curso', formData.grade)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (!data || data.length === 0) {
                    setSuggestedOAs([]);
                    return;
                }

                // Extract OA codes from objetivo_clase text (pattern: "OA X" or just numbers)
                const oaCounts = new Map<string, number>();
                data.forEach(row => {
                    const text = row.objetivo_clase || '';
                    const matches = text.match(/OA\s*(\d+)/gi);
                    if (matches) {
                        matches.forEach((m: string) => {
                            const code = m.replace(/OA\s*/i, '').trim();
                            oaCounts.set(code, (oaCounts.get(code) || 0) + 1);
                        });
                    }
                });

                const sorted = Array.from(oaCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([code]) => code);

                setSuggestedOAs(sorted);
            } catch {
                setSuggestedOAs([]);
            }
        };

        fetchSuggestions();
    }, [formData.grade, formData.subject]);

    const selectedOAOptions = useMemo(
        () => oaOptions.filter((oa) => formData.oaCodes.includes(oa.code)),
        [oaOptions, formData.oaCodes]
    );
    const filteredOAOptions = useMemo(() => {
        const query = oaSearchQuery.trim().toLowerCase();
        if (!query) return oaOptions;
        return oaOptions.filter((oa) =>
            oa.code.toLowerCase().includes(query) ||
            oa.unit.toLowerCase().includes(query) ||
            oa.description.toLowerCase().includes(query)
        );
    }, [oaOptions, oaSearchQuery]);
    const indicatorItems = useMemo(
        () =>
            selectedOAOptions.flatMap((oa) => {
                if (oa.indicators.length > 0) {
                    return oa.indicators.map((text) => ({ oaCode: oa.code, text }));
                }
                return [{ oaCode: oa.code, text: oa.description }];
            }).slice(0, 8),
        [selectedOAOptions]
    );


    return (
        <section className="relative z-10 animate-fade-in pb-12">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--on-background)] font-[family-name:var(--font-heading)] tracking-tight">Diseña tu Clase Perfecta</h1>
                <p className="text-[var(--muted)] text-sm md:text-base mt-1">
                    Motor pedagógico conectado al currículum nacional.
                </p>
            </div>

            <div className="glass-card-premium max-w-6xl mx-auto p-0 relative overflow-hidden transition-all duration-300">
                {/* Neural Background */}
                <div className="neural-bg opacity-20 pointer-events-none">
                    <div className="neural-orb orb-1" style={{ top: '-10%', left: '-10%', width: '400px', height: '400px', background: 'var(--primary)' }}></div>
                    <div className="neural-orb orb-2" style={{ bottom: '-10%', right: '-10%', width: '300px', height: '300px', background: 'var(--secondary)' }}></div>
                </div>

                {/* Progress Bar & Usage Nudge */}
                <div className="p-6 md:p-8 border-b border-[var(--border)] relative z-10 bg-[var(--card)]/50 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex justify-center items-center w-full md:w-auto relative">
                        {/* Step 1 */}
                        <div className="flex flex-col items-center gap-2 relative z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 shadow-lg ${step >= 1
                                ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white scale-110 shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                                : 'bg-[var(--card)] border border-[var(--border)] text-[var(--muted)]'
                                }`}>
                                {step > 1 ? <Check size={20} strokeWidth={3} /> : 1}
                            </div>
                            <span className={`text-xs font-bold tracking-wider uppercase ${step >= 1 ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`}>
                                Contexto
                            </span>
                        </div>

                        {/* Line 1-2 */}
                        <div className="w-16 md:w-24 h-[2px] bg-[var(--border)] mx-2 relative overflow-hidden rounded-full">
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] transition-all duration-700"
                                style={{ transform: step >= 2 ? 'translateX(0)' : 'translateX(-100%)' }}></div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center gap-2 relative z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 shadow-lg ${step >= 2
                                ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white scale-110 shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                                : 'bg-[var(--card)] border border-[var(--border)] text-[var(--muted)]'
                                }`}>
                                {step > 2 ? <Check size={20} strokeWidth={3} /> : 2}
                            </div>
                            <span className={`text-xs font-bold tracking-wider uppercase ${step >= 2 ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`}>
                                Detalles
                            </span>
                        </div>

                        {/* Line 2-3 */}
                        <div className="w-16 md:w-24 h-[2px] bg-[var(--border)] mx-2 relative overflow-hidden rounded-full">
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] transition-all duration-700"
                                style={{ transform: step >= 3 ? 'translateX(0)' : 'translateX(-100%)' }}></div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center gap-2 relative z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-500 shadow-lg ${step >= 3
                                ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white scale-110 shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                                : 'bg-[var(--card)] border border-[var(--border)] text-[var(--muted)]'
                                }`}>
                                3
                            </div>
                            <span className={`text-xs font-bold tracking-wider uppercase ${step >= 3 ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`}>
                                Revisar
                            </span>
                        </div>
                    </div>

                    {/* Usage Nudge */}
                    {credits !== null && (
                        <div className={`
                            flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold backdrop-blur-md transition-all
                            ${credits <= 3
                                ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                                : 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]'}
                        `}>
                            <Zap size={16} className="fill-current" />
                            <span>{credits} {credits === 1 ? 'clase restante' : 'clases restantes'}</span>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="p-6 md:p-10 relative z-20 min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-10"
                            >
                                {/* Subject Selection */}
                                <div>
                                    <label className="block text-sm font-bold mb-4 text-[var(--muted)] uppercase tracking-wider">Asignatura</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                        {SUBJECTS.map((sub) => {
                                            const isActive = sub.id === 'Electivo' ? isElectiveSelected : formData.subject === sub.id;
                                            return (
                                                <button
                                                    key={sub.id}
                                                    type="button"
                                                    onClick={() => updateField('subject', sub.id)}
                                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${isActive
                                                        ? 'bg-[var(--primary-bg)] border-[var(--primary)] shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                                                        : 'bg-[var(--input-bg)] border-[var(--border)] hover:border-[var(--muted)] hover:bg-[var(--card-hover)]'
                                                        }`}
                                                >
                                                    <sub.icon size={32} className={`mb-1 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--muted)] group-hover:text-[var(--foreground)]'}`} />
                                                    <span className={`text-sm font-medium ${isActive ? 'text-[var(--primary)]' : 'text-[var(--muted)] group-hover:text-[var(--foreground)]'}`}>{sub.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* Elective Sub-Selection */}
                                    <AnimatePresence>
                                        {isElectiveSelected && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden mt-4"
                                            >
                                                <div className="bg-[var(--card)]/30 border border-[var(--primary)]/30 rounded-xl p-5">
                                                    <h4 className="text-sm font-bold text-[var(--primary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <GraduationCap size={18} /> Selecciona el Electivo
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {ELECTIVES_LIST.map((elec) => (
                                                            <button
                                                                key={elec}
                                                                type="button"
                                                                onClick={() => updateField('subject', elec)}
                                                                className={`text-left px-4 py-3 rounded-lg text-sm transition-all ${formData.subject === elec
                                                                    ? 'bg-[var(--primary)] text-white shadow-lg'
                                                                    : 'bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--input-bg)]'
                                                                    }`}
                                                            >
                                                                {elec}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Grade Selection */}
                                <div>
                                    <label className="block text-sm font-bold mb-4 text-[var(--muted)] uppercase tracking-wider">Curso</label>
                                    <div className="flex flex-wrap gap-3">
                                        {GRADES.map((grade) => (
                                            <button
                                                key={grade}
                                                type="button"
                                                onClick={() => updateField('grade', grade)}
                                                className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-all ${formData.grade === grade
                                                    ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-purple-500/30'
                                                    : 'bg-[var(--input-bg)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--muted)] hover:text-[var(--foreground)]'
                                                    }`}
                                            >
                                                {grade}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Drafts */}
                                <div className="max-w-3xl border border-[var(--border)] rounded-xl p-4 bg-[var(--card)]/30">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <h4 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-2">
                                            <FolderOpen size={16} /> Borradores
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={draftName}
                                                onChange={(e) => setDraftName(e.target.value)}
                                                placeholder="Nombre del borrador (opcional)"
                                                className="bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => saveDraft(draftName)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-[var(--primary)] text-white"
                                            >
                                                <Save size={14} /> Guardar
                                            </button>
                                        </div>
                                    </div>

                                    {drafts.length === 0 ? (
                                        <p className="text-xs text-[var(--muted)]">Aún no tienes borradores guardados.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-40 overflow-auto">
                                            {drafts.map((draft) => (
                                                <div key={draft.id} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 border ${activeDraftId === draft.id ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] bg-[var(--input-bg)]'}`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => loadDraft(draft.id)}
                                                        className="text-left flex-1"
                                                    >
                                                        <p className="text-sm font-medium text-[var(--foreground)]">{draft.name}</p>
                                                        <p className="text-[10px] text-[var(--muted)]">Actualizado: {new Date(draft.updatedAt).toLocaleString('es-CL')}</p>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteDraft(draft.id)}
                                                        className="p-1.5 rounded-md text-[var(--muted)] hover:text-red-400"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* OA Field */}
                                <div className="max-w-3xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <label className="block text-sm font-bold text-[var(--muted)] uppercase tracking-wider">OA (Objetivos de Aprendizaje)</label>
                                        <Tooltip content="OA = Objetivo de Aprendizaje oficial del MINEDUC. Ej: 'Comprender textos orales'. Busca por código o descripción. ¿No estás seguro? Escribe el tema en el siguiente paso y nosotros lo alineamos.">
                                            <Info size={16} className="text-[var(--muted)] cursor-help hover:text-[var(--primary)] transition-colors" />
                                        </Tooltip>
                                    </div>

                                    {/* OA Suggestions based on user history */}
                                    {suggestedOAs.length > 0 && oaOptions.length > 0 && (
                                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                                            <span className="text-xs text-[var(--muted)] flex items-center gap-1">
                                                <History size={12} /> Usados frecuentemente:
                                            </span>
                                            {suggestedOAs.map(code => {
                                                const match = oaOptions.find(oa => oa.code === code);
                                                if (!match) return null;
                                                const isSelected = formData.oaCodes.includes(code);
                                                return (
                                                    <button
                                                        key={code}
                                                        type="button"
                                                        onClick={() => {
                                                            const next = isSelected
                                                                ? formData.oaCodes.filter(c => c !== code)
                                                                : [...formData.oaCodes, code];
                                                            const nextTexts = next.map(c => oaOptions.find(o => o.code === c)?.description || '');
                                                            setSelectedOAs(next, nextTexts);
                                                        }}
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                                                            isSelected
                                                                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                                                : 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30 hover:bg-[var(--primary)]/20'
                                                        }`}
                                                    >
                                                        OA {code}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={oaSearchQuery}
                                            onChange={(e) => setOaSearchQuery(e.target.value)}
                                            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl p-3 text-[var(--on-background)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all placeholder-[var(--muted)]/50"
                                            placeholder="Buscar OA por código, unidad o descripción..."
                                        />
                                    </div>

                                    {loadingOAs && (
                                        <p className="text-xs text-[var(--muted)] mt-2">Cargando catálogo OA...</p>
                                    )}

                                    {!loadingOAs && (
                                        <div className="mt-3 border border-[var(--border)] rounded-xl bg-[var(--card)]/30 max-h-60 overflow-auto">
                                            {filteredOAOptions.length === 0 ? (
                                                <p className="text-xs text-[var(--muted)] p-3">No hay OA para el filtro actual.</p>
                                            ) : (
                                                filteredOAOptions.map((oa) => {
                                                    const selected = formData.oaCodes.includes(oa.code);
                                                    return (
                                                        <button
                                                            key={`${oa.code}-${oa.unit}`}
                                                            type="button"
                                                            onClick={() => {
                                                                const next = selected
                                                                    ? formData.oaCodes.filter((code) => code !== oa.code)
                                                                    : [...formData.oaCodes, oa.code];
                                                                const nextTexts = next.map(c => oaOptions.find(o => o.code === c)?.description || '');
                                                                setSelectedOAs(next, nextTexts);
                                                            }}
                                                            className={`w-full text-left px-3 py-2 border-b border-[var(--border)]/40 last:border-b-0 transition-colors ${selected ? 'bg-[var(--primary)]/15 text-[var(--primary)]' : 'hover:bg-[var(--card-hover)] text-[var(--foreground)]'}`}
                                                        >
                                                            <div className="font-semibold text-sm">OA {oa.code} · {oa.unit}</div>
                                                            <div className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{oa.description}</div>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {formData.oaCodes.map((code) => (
                                            <span key={code} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/25">
                                                OA {code}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const next = formData.oaCodes.filter((oa) => oa !== code);
                                                        const nextTexts = next.map(c => oaOptions.find(o => o.code === c)?.description || '');
                                                        setSelectedOAs(next, nextTexts);
                                                    }}
                                                    className="text-[var(--primary)] hover:text-white"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>

                                    {selectedOAOptions.length > 0 && (
                                        <div className="mt-4 p-4 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl">
                                            <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Indicadores de evaluación (referenciales)</h5>
                                            <ul className="space-y-2 text-sm text-[var(--foreground)]">
                                                {indicatorItems.map((entry, idx) => (
                                                    <li key={`${entry.oaCode}-${idx}`} className="leading-snug">
                                                        <span className="font-semibold text-[var(--primary)]">OA {entry.oaCode}:</span> {entry.text}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button variant="primary" onClick={handleNext} className="gap-2 px-8 py-3 rounded-xl text-lg shadow-xl shadow-purple-500/20">
                                        Siguiente <ArrowRight size={20} strokeWidth={3} />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-10"
                            >
                                {/* Topic */}
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-[var(--muted)] uppercase tracking-wider">Objetivo específico de la clase</label>
                                    <textarea
                                        value={formData.topic}
                                        onChange={(e) => updateField('topic', e.target.value)}
                                        className="w-full min-h-[140px] bg-[var(--input-bg)] border border-[var(--border)] rounded-xl p-5 text-[var(--on-background)] text-lg focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all placeholder-[var(--muted)]/50 resize-y"
                                        placeholder="¿Qué quieres que aprendan hoy? Ej: Identificar los personajes principales de un cuento..."
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* NEE Selection */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <label className="block text-sm font-bold text-[var(--muted)] uppercase tracking-wider">Necesidades Educativas (Inclusión)</label>
                                            <Tooltip content="Adapta actividades y evaluaciones para estudiantes con NEE">
                                                <Info size={16} className="text-[var(--muted)] cursor-help hover:text-[var(--primary)] transition-colors" />
                                            </Tooltip>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {NEE_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => updateField('nee', opt.id)}
                                                    className={`text-left px-5 py-3 rounded-xl border transition-all flex items-center justify-between group ${formData.nee === opt.id
                                                        ? 'bg-[var(--primary-bg)] border-[var(--primary)] text-[var(--primary)]'
                                                        : 'bg-[var(--input-bg)] border-[var(--border)] text-[var(--muted)] hover:bg-[var(--card-hover)]'
                                                        }`}
                                                >
                                                    <span className="font-medium">{opt.label}</span>
                                                    {formData.nee === opt.id && <CheckCircle2 size={20} className="fill-current" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Duration Selection */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <label className="block text-sm font-bold text-[var(--muted)] uppercase tracking-wider">Duración de la Clase</label>
                                            <Tooltip content="Determina la extensión y profundidad de la planificación">
                                                <Info size={16} className="text-[var(--muted)] cursor-help hover:text-[var(--primary)] transition-colors" />
                                            </Tooltip>
                                        </div>
                                        <div className="flex gap-4">
                                            {DURATIONS.map((d) => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    onClick={() => updateField('duration', d)}
                                                    className={`flex-1 py-4 px-6 rounded-xl border text-center transition-all ${formData.duration === d
                                                        ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-purple-500/30 font-bold'
                                                        : 'bg-[var(--input-bg)] text-[var(--muted)] border-[var(--border)] hover:bg-[var(--card-hover)] font-medium'
                                                        }`}
                                                >
                                                    <Clock size={24} className="mb-2 mx-auto" strokeWidth={2.5} />
                                                    {d}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Datos del Profesor (Fijos) */}
                                        <div className="mt-8 space-y-4 pt-8 border-t border-[var(--border)]">
                                            <h4 className="text-[var(--muted)] text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                                <Users size={16} /> Identidad del Profesor
                                            </h4>
                                            <div className="bg-[var(--card)]/50 border border-[var(--border)] rounded-xl p-4 space-y-3">
                                                <div>
                                                    <span className="text-[10px] font-bold text-[var(--muted)] uppercase block">Nombre Completo</span>
                                                    <p className="text-[var(--foreground)] font-medium">{formData.userName || 'Cargando...'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-[var(--muted)] uppercase block">Correo Electrónico</span>
                                                    <p className="text-[var(--foreground)] font-medium">{formData.userEmail || 'Cargando...'}</p>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-[var(--muted)] italic">Estos datos se sincronizan automáticamente con tu cuenta.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* DUA Toggle */}
                                <div className="p-5 mt-6 rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-[var(--on-background)] flex items-center gap-2">
                                            🌟 Principios DUA (Diseño Universal de Aprendizaje)
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--primary)] text-white">Recomendado</span>
                                        </h4>
                                        <p className="text-xs text-[var(--muted)] mt-1.5 max-w-2xl leading-relaxed">
                                            Activa esta opción para incluir múltiples formas de representación, participación y expresión, adaptando la clase para incluir todos los estilos de aprendizaje en el aula.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => updateField('dua', !formData.dua)}
                                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 ${formData.dua ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`}
                                    >
                                        <span className="sr-only">Habilitar DUA</span>
                                        <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.dua ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex justify-between pt-6">
                                    <button onClick={handlePrev} className="px-6 py-3 text-[var(--muted)] hover:text-[var(--foreground)] font-medium transition-colors">
                                        Volver
                                    </button>
                                    <Button variant="primary" onClick={handleNext} className="gap-2 px-8 py-3 rounded-xl text-lg shadow-xl shadow-purple-500/20">
                                        Revisar <ArrowRight size={20} strokeWidth={3} />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="text-center py-6"
                            >
                                {!generating ? (
                                    <>
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(139,92,246,0.3)] border border-[var(--primary)]/30">
                                            <Sparkles size={48} className="text-[var(--primary)] animate-pulse fill-current" />
                                        </div>

                                        <h2 className="text-3xl font-bold text-[var(--on-background)] mb-2">¡Todo listo para crear!</h2>
                                        <p className="text-[var(--muted)] mb-10">Revisa los detalles antes de generar la magia.</p>

                                        <div className="max-w-2xl mx-auto bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl p-8 mb-10 text-left relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                                            <div className="grid grid-cols-2 gap-y-6 gap-x-8 relative z-10">
                                                <div>
                                                    <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">Asignatura</span>
                                                    <div className="flex items-center gap-2 text-[var(--foreground)] font-medium text-lg">
                                                        {formData.subject}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">Curso</span>
                                                    <div className="text-[var(--foreground)] font-medium text-lg">{formData.grade}</div>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">OA (Objetivo de Aprendizaje)</span>
                                                    <div className="text-[var(--foreground)] font-medium text-lg">
                                                        {formData.oaCodes.length > 0
                                                            ? formData.oaCodes.map((code) => `OA ${code}`).join(', ')
                                                            : `OA ${formData.oa}`}
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">Objetivo</span>
                                                    <div className="text-[var(--foreground)] text-lg leading-snug">{formData.topic}</div>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">Duración</span>
                                                    <div className="text-[var(--foreground)] font-medium">{formData.duration}</div>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">Inclusión (NEE)</span>
                                                    <div className="text-[var(--foreground)] font-medium">{formData.nee}</div>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">Principios DUA</span>
                                                    <div className="text-[var(--foreground)] font-medium">{formData.dua ? 'Activado' : 'Desactivado'}</div>
                                                </div>
                                                <div className="col-span-2 pt-4 border-t border-[var(--border)]/50 mt-2">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div>
                                                            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-0.5">Profesor</span>
                                                            <div className="text-[var(--foreground)] font-bold">{formData.userName}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-0.5">Email de Envío</span>
                                                            <div className="text-[var(--foreground)] text-sm">{formData.userEmail}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Kit Preview: what you'll receive */}
                                        <div className="max-w-2xl mx-auto mb-10">
                                            <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-3">Tu Kit incluirá</p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {[
                                                    { icon: '📋', label: 'Planificación', desc: 'Clase completa MINEDUC' },
                                                    { icon: '🎞️', label: 'Presentación', desc: 'Slides HTML editables' },
                                                    { icon: '✅', label: 'Quiz Interactivo', desc: 'Evaluación autocorregible' },
                                                    ...(formData.nee !== 'Ninguna' ? [{ icon: '🧩', label: 'PACI', desc: 'Adaptación curricular' }] : []),
                                                ].map((item, i) => (
                                                    <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--card)]/50 border border-[var(--border)]/50">
                                                        <span className="text-2xl">{item.icon}</span>
                                                        <span className="text-sm font-bold text-[var(--foreground)]">{item.label}</span>
                                                        <span className="text-[10px] text-[var(--muted)] text-center">{item.desc}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-[var(--muted)] mt-3 text-center">
                                                Costo: <strong className="text-[var(--primary)]">1 crédito</strong> de tus {credits ?? '...'} disponibles
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-center max-w-2xl mx-auto">
                                            <button onClick={handlePrev} className="px-6 py-3 text-[var(--muted)] hover:text-[var(--foreground)] font-medium transition-colors">
                                                Hacer cambios
                                            </button>
                                            <Button
                                                onClick={handleGenerate}
                                                className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:brightness-110 !px-12 !py-4 rounded-xl text-lg font-bold shadow-[0_0_30px_rgba(139,92,246,0.5)] border-none transform hover:scale-105 transition-all"
                                            >
                                                <Wand2 className="mr-2" size={24} /> Generar Kit
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-8 max-w-2xl mx-auto">
                                        {/* Main Icon with Animation */}
                                        <div className="relative w-28 h-28 mx-auto mb-8">
                                            <div className="absolute inset-0 bg-[var(--primary)]/30 rounded-full animate-ping"></div>
                                            <div className="absolute inset-0 bg-[var(--secondary)]/20 rounded-full animate-pulse"></div>
                                            <div className="relative z-10 w-full h-full bg-[var(--card)] rounded-full flex items-center justify-center border-2 border-[var(--primary)] shadow-[0_0_50px_rgba(139,92,246,0.5)]">
                                                <span className="text-4xl">{loadingMessages[loadingStage].icon}</span>
                                            </div>
                                        </div>

                                        {/* Current Stage Message */}
                                        <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                                            {loadingMessages[loadingStage].text}
                                        </h3>

                                        {/* Timer Display */}
                                        <div className="flex items-center justify-center gap-2 text-[var(--muted)] mb-6">
                                            <Clock size={16} />
                                            <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
                                            <span className="text-sm opacity-70">/ ~4:30 min</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="relative mb-8">
                                            <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--primary)] rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${loadingProgress}%` }}
                                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-[var(--muted)]">
                                                <span>Etapa {loadingStage + 1} de {loadingMessages.length}</span>
                                                <span className="font-bold text-[var(--primary)]">{Math.round(loadingProgress)}%</span>
                                            </div>
                                        </div>

                                        {/* Stage Pills */}
                                        <div className="flex flex-wrap justify-center gap-2 mb-8">
                                            {loadingMessages.slice(0, 6).map((msg, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${idx < loadingStage
                                                        ? 'bg-[var(--primary)] text-white'
                                                        : idx === loadingStage
                                                            ? 'bg-[var(--primary-bg)] text-[var(--primary)] border border-[var(--primary)] animate-pulse'
                                                            : 'bg-[var(--input-bg)] text-[var(--muted)]'
                                                        }`}
                                                >
                                                    {msg.icon}
                                                </div>
                                            ))}
                                            {loadingMessages.length > 6 && (
                                                <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--input-bg)] text-[var(--muted)]">
                                                    +{loadingMessages.length - 6}
                                                </div>
                                            )}
                                        </div>

                                        {/* Educational Tip */}
                                        <motion.div
                                            key={currentTip}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="bg-[var(--primary-bg)]/30 border border-[var(--primary)]/20 rounded-xl p-4 text-center"
                                        >
                                            <p className="text-sm text-[var(--muted)] italic">
                                                {educationalTips[currentTip]}
                                            </p>
                                        </motion.div>

                                        {/* Reassurance Message */}
                                        <p className="text-[var(--muted)] text-sm mt-6 text-center opacity-75">
                                            Tu kit se está generando. No cierres esta ventana.
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 6.16 — Upsell modal when credits exhausted */}
            <AnimatePresence>
                {showUpsell && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 md:p-10 max-w-md w-full text-center shadow-2xl"
                        >
                            <button
                                onClick={() => setShowUpsell(false)}
                                className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-5">
                                <TrendingUp className="text-amber-400 w-8 h-8" />
                            </div>

                            <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                                {plan === 'free'
                                    ? '¡Usaste tus 3 clases gratis!'
                                    : `Llegaste al límite de ${classesLimit} clases`}
                            </h3>

                            <p className="text-[var(--muted)] mb-6 leading-relaxed">
                                {plan === 'free'
                                    ? 'Mejora a Copihue y obtén 20 clases al mes por solo $695/clase.'
                                    : plan === 'copihue'
                                        ? 'Con Araucaria tendrías 35 clases + evaluaciones OMR por $626/clase.'
                                        : 'Con Cóndor tendrías 50 clases + retroalimentación pedagógica por $598/clase.'}
                            </p>

                            <div className="space-y-3">
                                <Button
                                    onClick={() => {
                                        setShowUpsell(false);
                                        window.location.href = '/dashboard/subscription';
                                    }}
                                    className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:brightness-110 !py-3 rounded-xl font-bold border-none"
                                >
                                    <Zap size={18} className="mr-2" />
                                    Ver Planes y Mejorar
                                </Button>
                                <button
                                    onClick={() => setShowUpsell(false)}
                                    className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                                >
                                    Continuar sin mejorar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
