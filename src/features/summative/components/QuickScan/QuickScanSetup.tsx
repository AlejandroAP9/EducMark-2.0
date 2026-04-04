'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, ArrowRight, Zap, Settings2 } from 'lucide-react';
import type { CorrectAnswers } from '../../types/omrScanner';

interface QuickScanSetupProps {
    onContinue: (data: {
        title: string;
        totalTF: number;
        totalMC: number;
        mcOptions: 4 | 5;
        correctAnswers: CorrectAnswers;
    }) => void;
    onSkipToScanner: (data: {
        title: string;
        totalTF: number;
        totalMC: number;
        mcOptions: 4 | 5;
        correctAnswers: CorrectAnswers;
    }) => void;
}

export const QuickScanSetup: React.FC<QuickScanSetupProps> = ({
    onContinue,
    onSkipToScanner,
}) => {
    const [title, setTitle] = useState('');
    const [totalTF, setTotalTF] = useState(0);
    const [totalMC, setTotalMC] = useState(20);
    const [mcOptions, setMcOptions] = useState<4 | 5>(4);
    const [correctAnswers, setCorrectAnswers] = useState<CorrectAnswers>({
        tf: [],
        mc: Array(20).fill('A'),
    });

    // Sync arrays when question counts change
    useEffect(() => {
        setCorrectAnswers((prev) => {
            const newTF = Array.from({ length: totalTF }, (_, i) => prev.tf[i] || 'V');
            const newMC = Array.from({ length: totalMC }, (_, i) => prev.mc[i] || 'A');
            return { tf: newTF, mc: newMC };
        });
    }, [totalTF, totalMC]);

    const totalQuestions = totalTF + totalMC;

    const getData = useCallback(() => ({
        title,
        totalTF,
        totalMC,
        mcOptions,
        correctAnswers,
    }), [title, totalTF, totalMC, mcOptions, correctAnswers]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-6"
        >
            {/* Instructions */}
            <div className="glass-card-premium p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                            <ClipboardCheck size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-[var(--on-background)]">
                                Configurar Pauta
                            </h2>
                            <p className="text-sm text-[var(--muted)]">
                                Define las respuestas correctas de tu evaluacion
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-[var(--muted)] leading-relaxed">
                        Ingresa la pauta de correccion manualmente. Esto permite corregir evaluaciones que
                        <strong className="text-[var(--on-background)]"> no fueron creadas en EducMark</strong> usando
                        el escaner OMR.
                    </p>
                </div>
            </div>

            {/* Title + Config */}
            <div className="glass-card-premium p-6 md:p-8 space-y-5">
                <div>
                    <label className="text-sm text-[var(--muted)] font-medium block mb-2">
                        Nombre de la evaluacion (opcional)
                    </label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: Prueba de Historia U2"
                        className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-[var(--on-background)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-[var(--muted)] font-medium block mb-2">
                            Preguntas V/F
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={20}
                            value={totalTF}
                            onChange={(e) =>
                                setTotalTF(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))
                            }
                            className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-[var(--on-background)] text-center text-lg font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-[var(--muted)] font-medium block mb-2">
                            Preguntas S.M.
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={60}
                            value={totalMC}
                            onChange={(e) =>
                                setTotalMC(Math.max(0, Math.min(60, parseInt(e.target.value) || 0)))
                            }
                            className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-[var(--on-background)] text-center text-lg font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
                        />
                    </div>
                </div>

                {/* MC Options selector */}
                <div>
                    <label className="text-sm text-[var(--muted)] font-medium block mb-2 flex items-center gap-1.5">
                        <Settings2 size={14} />
                        Opciones por pregunta S.M.
                    </label>
                    <div className="flex gap-3">
                        {([4, 5] as const).map((n) => (
                            <button
                                key={n}
                                onClick={() => setMcOptions(n)}
                                className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                                    mcOptions === n
                                        ? 'bg-[var(--primary)]/15 border-[var(--primary)]/40 text-[var(--primary)]'
                                        : 'bg-[var(--input-bg)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/30'
                                }`}
                            >
                                {n} opciones (A-{n === 4 ? 'D' : 'E'})
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Answer Key Grid */}
            <AnimatePresence>
                {totalQuestions > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="glass-card-premium p-6 md:p-8 space-y-6">
                            <h3 className="text-lg font-semibold text-[var(--on-background)] flex items-center gap-2">
                                <ClipboardCheck size={18} className="text-[var(--primary)]" />
                                Respuestas Correctas
                            </h3>

                            {totalTF > 0 && (
                                <div>
                                    <h4 className="text-sm text-[var(--muted)] font-medium mb-3">
                                        Verdadero / Falso
                                    </h4>
                                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                        {correctAnswers.tf.map((ans, i) => (
                                            <button
                                                key={`tf-${i}`}
                                                onClick={() => {
                                                    const updated = [...correctAnswers.tf];
                                                    updated[i] = ans === 'V' ? 'F' : 'V';
                                                    setCorrectAnswers({ ...correctAnswers, tf: updated });
                                                }}
                                                className={`p-2 text-center rounded-lg border text-sm font-bold transition-all ${
                                                    ans === 'V'
                                                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                                        : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                                                }`}
                                            >
                                                <span className="text-[10px] text-[var(--muted)] block">
                                                    {i + 1}
                                                </span>
                                                {ans}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {totalMC > 0 && (
                                <div>
                                    <h4 className="text-sm text-[var(--muted)] font-medium mb-3">
                                        Seleccion Multiple
                                    </h4>
                                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                        {correctAnswers.mc.map((ans, i) => {
                                            const options =
                                                mcOptions === 5
                                                    ? ['A', 'B', 'C', 'D', 'E']
                                                    : ['A', 'B', 'C', 'D'];
                                            return (
                                                <button
                                                    key={`mc-${i}`}
                                                    onClick={() => {
                                                        const nextIdx =
                                                            (options.indexOf(ans) + 1) % options.length;
                                                        const updated = [...correctAnswers.mc];
                                                        updated[i] = options[nextIdx];
                                                        setCorrectAnswers({
                                                            ...correctAnswers,
                                                            mc: updated,
                                                        });
                                                    }}
                                                    className="p-2 text-center rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm font-bold text-[var(--primary)] hover:border-[var(--primary)] transition-all"
                                                >
                                                    <span className="text-[10px] text-[var(--muted)] block">
                                                        {i + 1}
                                                    </span>
                                                    {ans}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onContinue(getData())}
                    disabled={totalQuestions === 0}
                    className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-shadow disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <ArrowRight size={22} />
                    Continuar
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSkipToScanner(getData())}
                    disabled={totalQuestions === 0}
                    className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--on-background)] font-bold text-lg hover:border-[var(--primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Zap size={22} />
                    Saltar a escanear
                </motion.button>
            </div>
        </motion.div>
    );
};
