'use client';

import React, { useEffect } from 'react';
import { ArrowLeft, Check, Zap } from 'lucide-react';
import { StepConfiguration } from './StepConfiguration';
import { StepBlueprint } from './StepBlueprint';
import { StepItemSelection } from './StepItemSelection';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTestDesignerStore } from '@/features/summative/store/useTestDesignerStore';

interface TestDesignerProps {
    testId: string | null;
    onExit: () => void;
}

export const TestDesigner: React.FC<TestDesignerProps> = ({ testId, onExit }) => {
    const router = useRouter();

    const {
        step,
        setStep,
        testData,
        setTestData,
        blueprint,
        setBlueprint,
        selectedItems,
        toggleItem,
        initTest,
        resetStore
    } = useTestDesignerStore();

    useEffect(() => {
        initTest(testId);
    }, [testId, initTest]);

    const handleFinalize = () => {
        setTimeout(() => {
            resetStore();
            onExit();
        }, 2500);
    };

    const handleBack = () => {
        resetStore();
        onExit();
    };

    return (
        <section className="relative z-10 animate-fade-in pb-12 w-full h-full">
            <div className="mb-4 text-center md:text-left flex items-center gap-4">
                <button onClick={handleBack} className="p-2 hover:bg-slate-800/50 rounded-full text-[var(--muted)] hover:text-white transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--on-background)] tracking-tight">
                        {testData.testTitle || 'Nueva Evaluación Sumativa'}
                    </h1>
                    <p className="text-[var(--muted)] text-sm">
                        Diseña evaluaciones alineadas al currículum en minutos.
                    </p>
                </div>
            </div>

            <div className="glass-card-premium max-w-6xl mx-auto p-0 relative overflow-hidden transition-all duration-300 min-h-[700px]">
                {/* Neural Background */}
                <div className="neural-bg opacity-20 pointer-events-none">
                    <div className="neural-orb orb-1" style={{ top: '-10%', left: '-10%', width: '400px', height: '400px', background: 'var(--primary)' }}></div>
                    <div className="neural-orb orb-2" style={{ bottom: '-10%', right: '-10%', width: '300px', height: '300px', background: 'var(--secondary)' }}></div>
                </div>

                {/* Progress Bar Header */}
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
                                Configuración
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
                                Blueprint
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
                                Selección
                            </span>
                        </div>
                    </div>
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
                                className="h-full"
                            >
                                <StepConfiguration />
                                <div className="flex justify-end pt-8 mt-8 border-t border-[var(--border)]">
                                    <button
                                        onClick={() => setStep(2)}
                                        disabled={!testData.grade || !testData.subject || !testData.unit}
                                        className="px-8 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        Continuar
                                    </button>
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
                            >
                                <StepBlueprint />
                                <div className="flex justify-between pt-8 mt-8 border-t border-[var(--border)]">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="px-6 py-3 text-[var(--muted)] hover:text-[var(--on-background)] font-medium transition-colors"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        onClick={() => setStep(3)}
                                        className="btn-gradient px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
                                    >
                                        Ver Ítems Sugeridos
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <StepItemSelection
                                    onFinalize={handleFinalize}
                                />
                                <div className="flex justify-start pt-8 mt-8 border-t border-[var(--border)]">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="px-6 py-3 text-[var(--muted)] hover:text-[var(--on-background)] font-medium transition-colors"
                                    >
                                        Atrás
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};
