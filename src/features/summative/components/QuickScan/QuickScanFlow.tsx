'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ClipboardCheck, FileText, ScanLine, CheckCircle2 } from 'lucide-react';
import type { CorrectAnswers } from '../../types/omrScanner';
import { QuickScanSetup } from './QuickScanSetup';
import { QuickScanScanner } from './QuickScanScanner';
import { AnswerSheetGenerator } from '../AnswerSheet/AnswerSheetGenerator';

type QuickScanStep = 'setup' | 'sheet' | 'scanner' | 'results';

interface QuickScanFlowProps {
    onBack: () => void;
}

const STEPS = [
    { key: 'setup' as const, label: 'Pauta', icon: ClipboardCheck },
    { key: 'sheet' as const, label: 'Hoja', icon: FileText },
    { key: 'scanner' as const, label: 'Escanear', icon: ScanLine },
    { key: 'results' as const, label: 'Resultados', icon: CheckCircle2 },
];

export const QuickScanFlow: React.FC<QuickScanFlowProps> = ({ onBack }) => {
    const [step, setStep] = useState<QuickScanStep>('setup');
    const [title, setTitle] = useState('');
    const [totalTF, setTotalTF] = useState(0);
    const [totalMC, setTotalMC] = useState(20);
    const [mcOptions, setMcOptions] = useState<4 | 5>(4);
    const [correctAnswers, setCorrectAnswers] = useState<CorrectAnswers>({ tf: [], mc: [] });

    const currentStepIndex = STEPS.findIndex((s) => s.key === step);

    const handleSetupComplete = useCallback(
        (data: {
            title: string;
            totalTF: number;
            totalMC: number;
            mcOptions: 4 | 5;
            correctAnswers: CorrectAnswers;
        }) => {
            setTitle(data.title);
            setTotalTF(data.totalTF);
            setTotalMC(data.totalMC);
            setMcOptions(data.mcOptions);
            setCorrectAnswers(data.correctAnswers);
            setStep('sheet');
        },
        []
    );

    const handleSkipToScanner = useCallback(
        (data: {
            title: string;
            totalTF: number;
            totalMC: number;
            mcOptions: 4 | 5;
            correctAnswers: CorrectAnswers;
        }) => {
            setTitle(data.title);
            setTotalTF(data.totalTF);
            setTotalMC(data.totalMC);
            setMcOptions(data.mcOptions);
            setCorrectAnswers(data.correctAnswers);
            setStep('scanner');
        },
        []
    );

    const handleNewAnswerKey = useCallback(() => {
        setStep('setup');
        setTitle('');
        setTotalTF(0);
        setTotalMC(20);
        setMcOptions(4);
        setCorrectAnswers({ tf: [], mc: [] });
    }, []);

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--on-background)] transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-[var(--on-background)]">
                        Correccion Rapida OMR
                    </h1>
                    <p className="text-sm text-[var(--muted)]">
                        Corrige evaluaciones externas con el escaner OMR
                    </p>
                </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between mb-8 px-2">
                {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const isActive = i === currentStepIndex;
                    const isCompleted = i < currentStepIndex;
                    return (
                        <React.Fragment key={s.key}>
                            <div className="flex flex-col items-center gap-1.5">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                                        isActive
                                            ? 'bg-[var(--primary)]/15 border-[var(--primary)] text-[var(--primary)] shadow-lg shadow-[var(--primary)]/20'
                                            : isCompleted
                                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                              : 'bg-[var(--input-bg)] border-[var(--border)] text-[var(--muted)]'
                                    }`}
                                >
                                    {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                                </div>
                                <span
                                    className={`text-xs font-medium ${
                                        isActive
                                            ? 'text-[var(--primary)]'
                                            : isCompleted
                                              ? 'text-emerald-400'
                                              : 'text-[var(--muted)]'
                                    }`}
                                >
                                    {s.label}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div
                                    className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300 ${
                                        i < currentStepIndex
                                            ? 'bg-emerald-500/40'
                                            : 'bg-[var(--border)]'
                                    }`}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
                {step === 'setup' && (
                    <motion.div
                        key="setup"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <QuickScanSetup
                            onContinue={handleSetupComplete}
                            onSkipToScanner={handleSkipToScanner}
                        />
                    </motion.div>
                )}

                {step === 'sheet' && (
                    <motion.div
                        key="sheet"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="space-y-4">
                            <AnswerSheetGenerator
                                evaluationData={{
                                    id: 'quick-scan',
                                    subject: title || 'Corrección Rápida',
                                    grade: '',
                                    unit: '',
                                    oa: '',
                                    answers: correctAnswers,
                                }}
                                onBack={() => setStep('setup')}
                            />
                            <div className="flex justify-end gap-3 px-6 pb-6">
                                <button
                                    onClick={() => setStep('scanner')}
                                    className="px-6 py-3 bg-linear-to-r from-violet-600 to-cyan-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                                >
                                    Continuar a escanear
                                    <ScanLine className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {(step === 'scanner' || step === 'results') && (
                    <motion.div
                        key="scanner"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <QuickScanScanner
                            title={title}
                            totalTF={totalTF}
                            totalMC={totalMC}
                            correctAnswers={correctAnswers}
                            mcOptions={mcOptions}
                            onNewAnswerKey={handleNewAnswerKey}
                            onStepChange={(s) => setStep(s)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
