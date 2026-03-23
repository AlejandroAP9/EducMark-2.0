'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Menu, Moon, Wand2, Search } from 'lucide-react';
import { useSubscriptionStore } from '@/features/auth/store/subscriptionStore';
import { useRouter } from 'next/navigation';
import { DashboardOverview } from './DashboardOverview';
import { AssessmentList } from './AssessmentList';
import { TestDesigner } from './TestDesigner/TestDesigner';
import { AnswerSheetGenerator } from './AnswerSheet';
import { OMRResultsView } from './AnswerSheet/OMRResultsView';
import { AssessmentAnalytics } from './Analytics/AssessmentAnalytics';
import { FeedbackDashboard } from './Analytics/FeedbackDashboard';
import { WebOMRScanner } from './OMRScanner/WebOMRScanner';
import { Sidebar } from '@/features/dashboard/components/Sidebar';
import { TrashBin } from '@/features/admin/components/TrashBin';
import { StudentManagement } from '@/features/dashboard/components/StudentManagement';
import { SpecificationTable } from './SpecificationTable';
import { createClient } from '@/lib/supabase/client';

interface AnswerSheetEvalData {
    id: string;
    subject: string;
    grade: string;
    unit: string;
    oa: string;
    answers?: {
        tf: string[];
        mc: string[];
    };
}

interface ItemBankRow {
    id: string;
    oa: string | null;
    subject: string | null;
    grade: string | null;
    cognitive_skill: string | null;
    question_type: string | null;
    question_text: string;
    created_at: string;
}

interface EvalItemRow {
    id: string;
    oa: string | null;
    question: string | null;
    skill: string | null;
    type: string | null;
    correct_answer: string | null;
}

interface EvaluationMeta {
    id: string;
    title: string;
    subject: string;
    grade: string;
}

const ItemBankView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const supabase = createClient();
    const [items, setItems] = useState<ItemBankRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const fetchBank = async () => {
            setLoading(true);
            try {
                const { data: userData } = await supabase.auth.getUser();
                const userId = userData?.user?.id;

                if (!userId) {
                    setItems([]);
                    return;
                }

                const { data: profileData, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('institution')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (profileError) {
                    console.warn('No se pudo obtener institucion del usuario:', profileError.message);
                }

                const institution = profileData?.institution || null;
                let memberIds: string[] = [userId];

                if (institution) {
                    const { data: members, error: membersError } = await supabase
                        .from('user_profiles')
                        .select('user_id')
                        .eq('institution', institution);

                    if (!membersError && members) {
                        memberIds = Array.from(new Set(members.map((m: { user_id: string }) => m.user_id).filter(Boolean)));
                    }
                }

                const { data: ownItems, error: ownError } = await supabase
                    .from('item_bank')
                    .select('id, oa, subject, grade, cognitive_skill, question_type, question_text, created_at')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (ownError) throw ownError;

                let sharedItems: ItemBankRow[] = [];
                if (memberIds.length > 0) {
                    const { data: shared, error: sharedError } = await supabase
                        .from('item_bank')
                        .select('id, oa, subject, grade, cognitive_skill, question_type, question_text, created_at')
                        .eq('is_shared', true)
                        .in('user_id', memberIds)
                        .order('created_at', { ascending: false });

                    if (sharedError) throw sharedError;
                    sharedItems = (shared || []) as ItemBankRow[];
                }

                const merged = [...(ownItems || []), ...sharedItems];
                const dedup = new Map<string, ItemBankRow>();
                merged.forEach((row) => dedup.set(row.id, row as ItemBankRow));
                setItems(Array.from(dedup.values()).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
            } catch (err) {
                console.error('Error loading item bank:', err);
                setItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBank();
    }, []);

    const filteredItems = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((item) =>
            (item.question_text || '').toLowerCase().includes(q) ||
            (item.oa || '').toLowerCase().includes(q) ||
            (item.subject || '').toLowerCase().includes(q) ||
            (item.grade || '').toLowerCase().includes(q)
        );
    }, [items, query]);

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Banco de Items</h2>
                <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800">
                    &larr; Volver al Resumen
                </button>
            </div>

            <div className="glass-card-premium p-5">
                <div className="relative max-w-md mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar por OA, pregunta, asignatura..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm"
                    />
                </div>

                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b border-[var(--border)]">
                                <th className="py-3 pr-3">OA</th>
                                <th className="py-3 pr-3">Pregunta</th>
                                <th className="py-3 pr-3">Tipo</th>
                                <th className="py-3 pr-3">Habilidad</th>
                                <th className="py-3 pr-3">Asignatura</th>
                                <th className="py-3">Curso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={6} className="py-6 text-center text-[var(--muted)]">Cargando items...</td>
                                </tr>
                            )}
                            {!loading && filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-6 text-center text-[var(--muted)]">No hay items disponibles.</td>
                                </tr>
                            )}
                            {!loading && filteredItems.map((item) => (
                                <tr key={item.id} className="border-b border-[var(--border)] align-top">
                                    <td className="py-3 pr-3 font-medium">{item.oa || '\u2014'}</td>
                                    <td className="py-3 pr-3 max-w-[540px]">{item.question_text}</td>
                                    <td className="py-3 pr-3">{item.question_type || '\u2014'}</td>
                                    <td className="py-3 pr-3">{item.cognitive_skill || '\u2014'}</td>
                                    <td className="py-3 pr-3">{item.subject || '\u2014'}</td>
                                    <td className="py-3">{item.grade || '\u2014'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const SpecificationView: React.FC<{ selectedEvalId: string | null }> = ({ selectedEvalId }) => {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [evaluation, setEvaluation] = useState<EvaluationMeta | null>(null);
    const [items, setItems] = useState<EvalItemRow[]>([]);

    useEffect(() => {
        const fetchSpecification = async () => {
            setLoading(true);
            try {
                const { data: userData } = await supabase.auth.getUser();
                const userId = userData?.user?.id;

                if (!userId) {
                    setEvaluation(null);
                    setItems([]);
                    return;
                }

                let evaluationId = selectedEvalId;
                let evalMeta: EvaluationMeta | null = null;

                if (evaluationId) {
                    const { data, error } = await supabase
                        .from('evaluations')
                        .select('id, title, subject, grade')
                        .eq('id', evaluationId)
                        .eq('user_id', userId)
                        .single();

                    if (error) throw error;
                    evalMeta = data;
                } else {
                    const { data, error } = await supabase
                        .from('evaluations')
                        .select('id, title, subject, grade')
                        .eq('user_id', userId)
                        .neq('status', 'archived')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (error) throw error;
                    evalMeta = data || null;
                    evaluationId = data?.id || null;
                }

                setEvaluation(evalMeta);

                if (!evaluationId) {
                    setItems([]);
                    return;
                }

                const { data: evalItems, error: itemsError } = await supabase
                    .from('evaluation_items')
                    .select('id, oa, question, skill, type, correct_answer')
                    .eq('evaluation_id', evaluationId)
                    .order('created_at', { ascending: true });

                if (itemsError) throw itemsError;
                setItems(evalItems || []);
            } catch (err) {
                console.error('Error loading specification table:', err);
                setEvaluation(null);
                setItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSpecification();
    }, [selectedEvalId]);

    if (loading) {
        return <div className="glass-card-premium p-6 text-[var(--muted)]">Cargando tabla de especificaciones...</div>;
    }

    if (!evaluation) {
        return <div className="glass-card-premium p-6 text-[var(--muted)]">No hay evaluaciones disponibles para mostrar.</div>;
    }

    if (items.length === 0) {
        return <div className="glass-card-premium p-6 text-[var(--muted)]">La evaluacion seleccionada no tiene items guardados.</div>;
    }

    const specItems = items.map((item) => ({
        id: item.id,
        unit: '',
        oa: item.oa || 'General',
        question: item.question || '',
        skill: item.skill || 'No definida',
        correctAnswer: item.correct_answer || '\u2014',
        score: item.type === 'tf' || item.type === 'Verdadero o Falso' ? 1 : 2,
    }));

    return (
        <SpecificationTable
            items={specItems}
            title={evaluation.title || 'Evaluacion'}
            subject={evaluation.subject || ''}
            grade={evaluation.grade || ''}
        />
    );
};

type ViewType = 'dashboard' | 'designer' | 'answersheet' | 'omr-results' | 'analytics' | 'specification' | 'items' | 'assessment' | 'omr-scanner' | 'feedback' | 'students' | 'trash';

function SummativeHeader({ setMobileOpen }: { setMobileOpen: (open: boolean) => void }) {
    const { planName, fullName, credits, classesLimit } = useSubscriptionStore();
    const router = useRouter();
    const percentage = classesLimit > 0 ? (credits.used / classesLimit) * 100 : 0;
    const colorClass = percentage >= 80 ? 'text-red-400 bg-red-500/10 border-red-500/20' : percentage >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

    return (
        <header className="top-header">
            <div className="mobile-toggle block md:hidden mr-4">
                <button onClick={() => setMobileOpen(true)}>
                    <Menu size={24} />
                </button>
            </div>
            <div className="flex-1"></div>
            <div className="header-actions">
                <button
                    onClick={() => router.push('/dashboard/subscription')}
                    className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors hover:opacity-80 ${colorClass}`}
                    title="Uso de créditos"
                >
                    <Wand2 size={13} />
                    <span>{credits.used}/{classesLimit}</span>
                </button>
                <button className="header-btn" onClick={() => document.body.classList.toggle('light-mode')} title="Cambiar Tema">
                    <Moon size={20} />
                </button>
                <div className="user-profile">
                    <div className="text-right hidden md:block mr-3">
                        <div className="text-sm font-semibold text-[var(--on-background)] leading-tight">
                            {fullName || 'Usuario'}
                        </div>
                        <div className="text-[11px] text-[var(--muted)] font-medium">
                            {planName}
                        </div>
                    </div>
                    <div className="avatar">
                        {(fullName || 'U').charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
}

export const SummativeAssessmentPage = () => {
    const supabase = createClient();
    const [activeView, setActiveView] = useState<ViewType>('dashboard');
    const [editingTestId, setEditingTestId] = useState<string | null>(null);
    const [answerSheetData, setAnswerSheetData] = useState<AnswerSheetEvalData | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [selectedSpecEvalId, setSelectedSpecEvalId] = useState<string | null>(null);
    const [feedbackEvalId, setFeedbackEvalId] = useState<string | undefined>(undefined);

    const handleCreateTest = () => {
        setEditingTestId(null);
        setActiveView('designer');
    };

    const handleEditTest = (id: string) => {
        setEditingTestId(id);
        setActiveView('designer');
    };

    const handleBackToManager = () => {
        setActiveView('assessment');
        setEditingTestId(null);
    };

    const handleOpenAnswerSheet = (evalData?: AnswerSheetEvalData) => {
        setAnswerSheetData(evalData || null);
        setActiveView('answersheet');
    };

    const handleBackFromAnswerSheet = () => {
        setActiveView('dashboard');
        setAnswerSheetData(null);
    };

    return (
        <div className="app-container">
            <div className="background-mesh">
                <div className="mesh-orb orb-1"></div>
                <div className="mesh-orb orb-2"></div>
            </div>

            <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

            <main className="main-content">
                <SummativeHeader setMobileOpen={setMobileOpen} />

                <div className="content-wrapper px-6 pt-2 pb-6 h-full overflow-auto">
                    {activeView === 'dashboard' && <DashboardOverview
                        onCreateTest={handleCreateTest}
                        onOpenAnswerSheet={() => handleOpenAnswerSheet()}
                        onOpenResults={() => setActiveView('omr-results')}
                        onViewSpecs={() => {
                            setSelectedSpecEvalId(null);
                            setActiveView('specification');
                        }}
                        onOpenAnalytics={() => setActiveView('analytics')}
                        onOpenScanner={() => setActiveView('omr-scanner')}
                        onOpenFeedback={() => setActiveView('feedback')}
                        onOpenStudents={() => setActiveView('students')}
                        onOpenTrash={() => setActiveView('trash')}
                    />}

                    {activeView === 'assessment' && (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">Banco de Evaluaciones</h2>
                                <button onClick={() => setActiveView('dashboard')} className="text-sm text-gray-500 hover:text-gray-800">
                                    &larr; Volver al Resumen
                                </button>
                            </div>
                            <AssessmentList onCreate={handleCreateTest} onEdit={handleEditTest} />
                        </div>
                    )}

                    {activeView === 'designer' && (
                        <TestDesigner
                            testId={editingTestId}
                            onExit={handleBackToManager}
                        />
                    )}

                    {activeView === 'items' && (
                        <ItemBankView onBack={() => setActiveView('dashboard')} />
                    )}

                    {activeView === 'specification' && (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">Tabla de Especificaciones</h2>
                                <button onClick={() => setActiveView('dashboard')} className="text-sm text-gray-500 hover:text-gray-800">
                                    &larr; Volver al Resumen
                                </button>
                            </div>
                            <SpecificationView selectedEvalId={selectedSpecEvalId} />
                        </div>
                    )}

                    {activeView === 'answersheet' && (
                        <AnswerSheetGenerator
                            evaluationData={answerSheetData || undefined}
                            onBack={handleBackFromAnswerSheet}
                        />
                    )}

                    {activeView === 'omr-results' && (
                        <OMRResultsView onBack={() => setActiveView('dashboard')} />
                    )}

                    {activeView === 'analytics' && (
                        <AssessmentAnalytics onBack={() => setActiveView('dashboard')} />
                    )}

                    {activeView === 'omr-scanner' && (
                        <WebOMRScanner
                            onBack={() => setActiveView('dashboard')}
                            onOpenFeedback={(evalId) => {
                                setFeedbackEvalId(evalId);
                                setActiveView('feedback');
                            }}
                        />
                    )}

                    {activeView === 'students' && (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-3 mb-6">
                                <button
                                    onClick={() => setActiveView('dashboard')}
                                    className="text-sm text-[var(--muted)] hover:text-[var(--on-background)] transition-colors"
                                >
                                    &larr; Volver
                                </button>
                            </div>
                            <StudentManagement />
                        </div>
                    )}

                    {activeView === 'trash' && (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-3 mb-6">
                                <button
                                    onClick={() => setActiveView('dashboard')}
                                    className="text-sm text-[var(--muted)] hover:text-[var(--on-background)] transition-colors"
                                >
                                    &larr; Volver
                                </button>
                            </div>
                            <TrashBin />
                        </div>
                    )}

                    {activeView === 'feedback' && (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-3 mb-6">
                                <button
                                    onClick={() => setActiveView('dashboard')}
                                    className="text-sm text-[var(--muted)] hover:text-[var(--on-background)] transition-colors"
                                >
                                    &larr; Volver
                                </button>
                            </div>
                            <FeedbackDashboard initialEvalId={feedbackEvalId} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
