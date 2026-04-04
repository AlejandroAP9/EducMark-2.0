'use client';

import React from 'react';
import { Trash2, FileDown } from 'lucide-react';
import type { ExitTicket, ExitTicketQuestion, TicketQuestionType } from './KitResultTypes';

export interface KitResultExitTicketProps {
    exitTicket: ExitTicket;
    setExitTicket: React.Dispatch<React.SetStateAction<ExitTicket>>;
    onExportTicket: () => void;
    pushUndo: () => void;
}

export function KitResultExitTicket({
    exitTicket,
    setExitTicket,
    onExportTicket,
    pushUndo,
}: KitResultExitTicketProps) {
    const addQuestion = (type: TicketQuestionType) => {
        setExitTicket((prev) => {
            const nextId = prev.questions.length + 1;
            const question: ExitTicketQuestion = {
                id: nextId,
                type,
                question: '',
                options: type === 'multiple_choice' ? ['', '', '', ''] : [],
                answer: null,
            };
            return { ...prev, questions: [...prev.questions, question] };
        });
    };

    const updateQuestion = (idx: number, patch: Partial<ExitTicketQuestion>) => {
        setExitTicket((prev) => ({
            ...prev,
            questions: prev.questions.map((item, index) => (index === idx ? { ...item, ...patch } : item)),
        }));
    };

    const removeQuestion = (idx: number) => {
        pushUndo();
        setExitTicket((prev) => ({
            ...prev,
            questions: prev.questions
                .filter((_, index) => index !== idx)
                .map((item, index) => ({ ...item, id: index + 1 })),
        }));
    };

    return (
        <div className="glass-card-premium p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h2 className="text-xl font-bold text-[var(--on-background)]">Ticket de salida configurable</h2>
                <button
                    type="button"
                    onClick={onExportTicket}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--card-hover)]"
                >
                    <FileDown size={16} /> Exportar / Imprimir
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-[var(--muted)]">Título</label>
                    <input
                        value={exitTicket.title}
                        onChange={(e) => setExitTicket((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2.5"
                    />
                </div>
                <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-[var(--muted)]">Instrucciones</label>
                    <input
                        value={exitTicket.instructions}
                        onChange={(e) => setExitTicket((prev) => ({ ...prev, instructions: e.target.value }))}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2.5"
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => addQuestion('multiple_choice')} className="px-3 py-1.5 rounded-lg text-xs bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                    + Opción múltiple
                </button>
                <button type="button" onClick={() => addQuestion('true_false')} className="px-3 py-1.5 rounded-lg text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    + Verdadero/Falso
                </button>
                <button type="button" onClick={() => addQuestion('open')} className="px-3 py-1.5 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    + Respuesta abierta
                </button>
            </div>

            <div className="space-y-3">
                {exitTicket.questions.length === 0 && (
                    <p className="text-sm text-[var(--muted)]">Aún no hay preguntas en el ticket.</p>
                )}
                {exitTicket.questions.map((q, idx) => (
                    <div key={`question-${q.id}-${idx}`} className="rounded-xl border border-[var(--border)] bg-[var(--card)]/30 p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs uppercase tracking-wider text-[var(--muted)] font-bold">
                                Pregunta {idx + 1} · {q.type === 'multiple_choice' ? 'Opción múltiple' : q.type === 'true_false' ? 'V/F' : 'Abierta'}
                            </span>
                            <button type="button" onClick={() => removeQuestion(idx)} className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10">
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <input
                            value={q.question}
                            onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2.5"
                            placeholder="Enunciado de la pregunta"
                        />
                        {q.type === 'multiple_choice' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {(q.options || []).map((opt, optIdx) => (
                                    <input
                                        key={`option-${idx}-${optIdx}`}
                                        value={opt}
                                        onChange={(e) => {
                                            const nextOptions = [...(q.options || [])];
                                            nextOptions[optIdx] = e.target.value;
                                            updateQuestion(idx, { options: nextOptions });
                                        }}
                                        className="bg-[var(--input-bg)] border border-[var(--border)] rounded-lg p-2.5"
                                        placeholder={`Opción ${String.fromCharCode(65 + optIdx)}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
