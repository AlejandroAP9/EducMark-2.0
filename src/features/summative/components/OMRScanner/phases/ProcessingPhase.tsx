'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine } from 'lucide-react';
import { PROCESSING_STEPS } from '../../../services/omrProcessing';

export interface ProcessingPhaseProps {
    processingStep: number;
}

export const ProcessingPhase: React.FC<ProcessingPhaseProps> = ({ processingStep }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-2xl mx-auto text-center py-16 px-8 glass-card-premium rounded-2xl relative overflow-hidden"
    >
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block mb-6 relative z-10"
        >
            <div className="w-20 h-20 rounded-full border border-[var(--border)] bg-[var(--input-bg)] flex items-center justify-center relative shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400"></div>
                <ScanLine size={32} className="text-cyan-400" />
            </div>
        </motion.div>

        <h3 className="text-3xl font-bold text-[var(--on-background)] mb-3 relative z-10">Procesando hoja de respuestas...</h3>

        <AnimatePresence mode="wait">
            <motion.div
                key={processingStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center gap-2 mb-8 relative z-10"
            >
                <span className="text-2xl">{PROCESSING_STEPS[processingStep].icon}</span>
                <span className="text-[var(--muted)] text-lg font-medium">
                    {PROCESSING_STEPS[processingStep].text}
                </span>
            </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-center gap-2 mb-8 relative z-10">
            {PROCESSING_STEPS.map((_, i) => (
                <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === processingStep
                        ? 'bg-cyan-400 scale-125 shadow-lg shadow-cyan-400/50'
                        : i < processingStep
                            ? 'bg-cyan-400/40'
                            : 'bg-[var(--border)]'
                        }`}
                />
            ))}
        </div>

        <div className="max-w-md mx-auto relative z-10">
            <div className="w-full h-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-full overflow-hidden shadow-inner">
                <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    initial={{ width: '5%' }}
                    animate={{ width: '92%' }}
                    transition={{ duration: 10, ease: 'easeOut' }}
                />
            </div>
            <p className="text-xs text-[var(--muted)] mt-3 font-medium">
                Motor OMR v2.1 · Vision Artificial
            </p>
        </div>
    </motion.div>
);
