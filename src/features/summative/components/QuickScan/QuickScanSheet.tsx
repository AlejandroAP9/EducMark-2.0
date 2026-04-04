'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileDown, Printer, ArrowRight, ArrowLeft, SkipForward } from 'lucide-react';
import { AnswerSheetPreview, generateDownloadableHTML } from '../AnswerSheet/AnswerSheetPreview';
import { downloadHtmlAsPdf } from '@/shared/lib/htmlToPdf';
import { toast } from 'sonner';
import type { CorrectAnswers } from '../../types/omrScanner';

interface QuickScanSheetProps {
    title: string;
    totalTF: number;
    totalMC: number;
    correctAnswers: CorrectAnswers;
    mcOptions: 4 | 5;
    onContinue: () => void;
    onSkip: () => void;
    onBack: () => void;
}

export const QuickScanSheet: React.FC<QuickScanSheetProps> = ({
    title,
    totalTF,
    totalMC,
    correctAnswers,
    mcOptions,
    onContinue,
    onSkip,
    onBack,
}) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const evaluationInfo = {
        id: 'quick-scan',
        subject: title || 'Correccion Rapida',
        grade: '',
        unit: '',
        oa: '',
    };

    const handleDownload = useCallback(async () => {
        setIsDownloading(true);
        try {
            const html = await generateDownloadableHTML(
                evaluationInfo,
                correctAnswers,
                null,
                totalTF,
                totalMC,
                undefined,
                undefined,
                [],
                mcOptions
            );
            await downloadHtmlAsPdf(html, `hoja-respuestas-${title || 'quick-scan'}.html`);
            toast.success('Hoja de respuestas descargada');
        } catch (err) {
            console.error('Error downloading answer sheet:', err);
            toast.error('No se pudo descargar la hoja de respuestas');
        } finally {
            setIsDownloading(false);
        }
    }, [evaluationInfo, correctAnswers, totalTF, totalMC, mcOptions, title]);

    const handlePrint = useCallback(async () => {
        try {
            const html = await generateDownloadableHTML(
                evaluationInfo,
                correctAnswers,
                null,
                totalTF,
                totalMC,
                undefined,
                undefined,
                [],
                mcOptions
            );
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(html);
                printWindow.document.close();
                setTimeout(() => printWindow.print(), 500);
            }
        } catch (err) {
            console.error('Error printing answer sheet:', err);
            toast.error('No se pudo imprimir la hoja de respuestas');
        }
    }, [evaluationInfo, correctAnswers, totalTF, totalMC, mcOptions]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="glass-card-premium p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="relative z-10">
                    <h2 className="text-xl md:text-2xl font-bold text-[var(--on-background)] mb-2">
                        Hoja de Respuestas
                    </h2>
                    <p className="text-sm text-[var(--muted)]">
                        Genera e imprime hojas OMR para que tus alumnos marquen sus respuestas.
                        {totalTF > 0 && ` ${totalTF} V/F`}
                        {totalTF > 0 && totalMC > 0 && ' +'}
                        {totalMC > 0 && ` ${totalMC} S.M.`}
                    </p>
                </div>
            </div>

            {/* Preview */}
            <div className="glass-card-premium p-2 rounded-2xl overflow-hidden" style={{ height: '500px' }}>
                <AnswerSheetPreview
                    evaluationInfo={evaluationInfo}
                    answers={correctAnswers}
                    trueFalseCount={totalTF}
                    multipleChoiceCount={totalMC}
                    mcOptions={mcOptions}
                />
            </div>

            {/* Download & Print */}
            <div className="grid grid-cols-2 gap-4">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--on-background)] font-semibold hover:border-amber-500/40 transition-colors disabled:opacity-50"
                >
                    <FileDown size={18} />
                    {isDownloading ? 'Descargando...' : 'Descargar PDF'}
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--on-background)] font-semibold hover:border-amber-500/40 transition-colors"
                >
                    <Printer size={18} />
                    Imprimir
                </motion.button>
            </div>

            {/* Navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--muted)] font-medium hover:text-[var(--on-background)] transition-colors"
                >
                    <ArrowLeft size={18} />
                    Volver
                </button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onContinue}
                    className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow"
                >
                    <ArrowRight size={18} />
                    Continuar al escaner
                </motion.button>

                <button
                    onClick={onSkip}
                    className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-[var(--muted)] text-sm font-medium hover:text-[var(--on-background)] transition-colors"
                >
                    <SkipForward size={16} />
                    Ya tengo hojas, saltar
                </button>
            </div>
        </motion.div>
    );
};
