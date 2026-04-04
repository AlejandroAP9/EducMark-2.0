'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Send, XCircle, AlertTriangle } from 'lucide-react';

export interface PreviewPhaseProps {
    capturedImage: string | null;
    qualityWarning: string | null;
    error: string | null;
    retake: () => void;
    processImage: () => void;
}

export const PreviewPhase: React.FC<PreviewPhaseProps> = ({
    capturedImage, qualityWarning, error, retake, processImage,
}) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
    >
        <div className="glass-card-premium p-2 rounded-2xl overflow-hidden">
            {capturedImage && (
                <img
                    src={capturedImage}
                    alt="Hoja capturada"
                    className="w-full rounded-xl"
                />
            )}
        </div>

        {qualityWarning && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm text-amber-300 font-medium">{qualityWarning}</p>
                    <p className="text-xs text-amber-300/60 mt-1">Puede continuar, pero la precision podria verse afectada.</p>
                </div>
            </div>
        )}

        {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                <XCircle size={20} className="text-rose-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-rose-300">{error}</p>
            </div>
        )}

        <div className="grid grid-cols-2 gap-4">
            <button
                onClick={retake}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--on-background)] font-semibold hover:border-[var(--primary)] transition-colors"
            >
                <RotateCcw size={18} />
                Reintentar
            </button>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={processImage}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow"
            >
                <Send size={18} />
                Procesar
            </motion.button>
        </div>
    </motion.div>
);
