'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, Download, Info, AlertTriangle, Layers, ScanLine
} from 'lucide-react';
import type { CorrectAnswers, EvaluationOption, PendingScanRequest, PendingResultPayload } from '../../../types/omrScanner';

export interface SetupPhaseProps {
    isOnline: boolean;
    pendingRequests: PendingScanRequest[];
    pendingResults: PendingResultPayload[];
    selectedEvaluationId: string;
    setSelectedEvaluationId: (id: string) => void;
    evaluations: EvaluationOption[];
    studentName: string;
    setStudentName: (name: string) => void;
    studentId: string;
    setStudentId: (id: string) => void;
    showAnswerConfig: boolean;
    setShowAnswerConfig: (show: boolean) => void;
    totalTF: number;
    setTotalTF: (n: number) => void;
    totalMC: number;
    setTotalMC: (n: number) => void;
    correctAnswers: CorrectAnswers;
    setCorrectAnswers: (answers: CorrectAnswers) => void;
    startCamera: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isBatchMode: boolean;
    setIsBatchMode: (mode: boolean) => void;
}

export const SetupPhase: React.FC<SetupPhaseProps> = ({
    isOnline, pendingRequests, pendingResults,
    selectedEvaluationId, setSelectedEvaluationId, evaluations,
    studentName, setStudentName, studentId, setStudentId,
    showAnswerConfig, setShowAnswerConfig,
    totalTF, setTotalTF, totalMC, setTotalMC,
    correctAnswers, setCorrectAnswers,
    startCamera, fileInputRef, handleFileUpload,
    isBatchMode, setIsBatchMode,
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-8"
    >
        {/* Instructions Card */}
        <div className="glass-card-premium p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <ScanLine size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--on-background)]">Escaner OMR Web</h2>
                        <p className="text-sm text-[var(--muted)]">Escanea hojas de respuestas con la camara</p>
                    </div>
                </div>

                <div className="space-y-4 text-[var(--muted)]">
                    <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 mt-0.5 w-6 h-6 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] text-xs font-bold">1</span>
                        <p className="text-base">Configura la <strong className="text-[var(--on-background)]">pauta de correccion</strong> con las respuestas correctas.</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 mt-0.5 w-6 h-6 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] text-xs font-bold">2</span>
                        <p className="text-base">Toma una <strong className="text-[var(--on-background)]">foto de la hoja de respuestas</strong> o sube una imagen.</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 mt-0.5 w-6 h-6 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] text-xs font-bold">3</span>
                        <p className="text-base">El sistema <strong className="text-[var(--on-background)]">detecta las marcas automaticamente</strong> y calcula el puntaje.</p>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-300/80">
                        Usa la hoja de respuestas estandar de EducMark. Buena iluminacion y enfoque mejoran la precision.
                    </p>
                </div>
            </div>
        </div>

        <div className="glass-card-premium p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-[var(--on-background)]">Escaner OMR</h3>
                    <p className="text-sm text-[var(--muted)]">
                        {isOnline ? 'Conectado al servidor de correccion' : 'Sin conexion — los escaneos se guardaran localmente'}
                        {(pendingRequests.length + pendingResults.length) > 0 && ` · ${pendingRequests.length + pendingResults.length} pendiente(s)`}
                    </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isOnline ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                </span>
            </div>

            <div>
                <label className="text-sm text-[var(--muted)] font-medium block mb-2">Evaluacion destino</label>
                <select
                    value={selectedEvaluationId}
                    onChange={(e) => setSelectedEvaluationId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-[var(--on-background)]"
                >
                    {evaluations.length === 0 && (
                        <option value="">No hay evaluaciones activas</option>
                    )}
                    {evaluations.map((evaluation) => (
                        <option key={evaluation.id} value={evaluation.id}>
                            {evaluation.title} {evaluation.grade ? `· ${evaluation.grade}` : ''} {evaluation.subject ? `· ${evaluation.subject}` : ''}
                        </option>
                    ))}
                </select>
                {!selectedEvaluationId && (
                    <p className="text-xs text-amber-300 mt-2">Debes seleccionar una evaluacion para poder guardar y sincronizar escaneos.</p>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="text-sm text-[var(--muted)] font-medium block mb-2">Nombre estudiante</label>
                    <input
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Ej: Martina Soto"
                        className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-[var(--on-background)]"
                    />
                </div>
                <div>
                    <label className="text-sm text-[var(--muted)] font-medium block mb-2">ID estudiante (opcional)</label>
                    <input
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="RUT o codigo interno"
                        className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-[var(--on-background)]"
                    />
                </div>
            </div>
            <p className="text-xs text-[var(--muted)]">
                Para evitar duplicados por rescaneo, completa al menos nombre o ID del estudiante.
            </p>
        </div>

        {/* Answer Key Config */}
        <div className="glass-card-premium p-8">
            <button
                onClick={() => setShowAnswerConfig(!showAnswerConfig)}
                className="w-full flex items-center justify-between text-left"
            >
                <div className="flex items-center gap-3">
                    <Info size={20} className="text-[var(--primary)]" />
                    <span className="text-lg font-semibold text-[var(--on-background)]">Pauta de Correccion</span>
                </div>
                <span className="text-sm text-[var(--muted)]">{showAnswerConfig ? 'Ocultar' : 'Configurar'}</span>
            </button>

            <AnimatePresence>
                {showAnswerConfig && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-[var(--muted)] font-medium block mb-2">Preguntas V/F</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={20}
                                        value={totalTF}
                                        onChange={(e) => setTotalTF(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
                                        className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-[var(--on-background)] text-center text-lg font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-[var(--muted)] font-medium block mb-2">Preguntas S.M.</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={60}
                                        value={totalMC}
                                        onChange={(e) => setTotalMC(Math.max(0, Math.min(60, parseInt(e.target.value) || 0)))}
                                        className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-[var(--on-background)] text-center text-lg font-mono focus:outline-none focus:border-[var(--primary)] transition-colors"
                                    />
                                </div>
                            </div>

                            {totalTF > 0 && (
                                <div>
                                    <h4 className="text-sm text-[var(--muted)] font-medium mb-3">Respuestas V/F correctas</h4>
                                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                        {correctAnswers.tf.map((ans, i) => (
                                            <button
                                                key={`tf-${i}`}
                                                onClick={() => {
                                                    const updated = [...correctAnswers.tf];
                                                    updated[i] = ans === 'V' ? 'F' : 'V';
                                                    setCorrectAnswers({ ...correctAnswers, tf: updated });
                                                }}
                                                className={`p-2 text-center rounded-lg border text-sm font-bold transition-all ${ans === 'V'
                                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                                                    }`}
                                            >
                                                <span className="text-[10px] text-[var(--muted)] block">{i + 1}</span>
                                                {ans}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {totalMC > 0 && (
                                <div>
                                    <h4 className="text-sm text-[var(--muted)] font-medium mb-3">Respuestas S.M. correctas</h4>
                                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                        {correctAnswers.mc.map((ans, i) => (
                                            <button
                                                key={`mc-${i}`}
                                                onClick={() => {
                                                    const options = ['A', 'B', 'C', 'D', 'E'];
                                                    const nextIdx = (options.indexOf(ans) + 1) % options.length;
                                                    const updated = [...correctAnswers.mc];
                                                    updated[i] = options[nextIdx];
                                                    setCorrectAnswers({ ...correctAnswers, mc: updated });
                                                }}
                                                className="p-2 text-center rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm font-bold text-[var(--primary)] hover:border-[var(--primary)] transition-all"
                                            >
                                                <span className="text-[10px] text-[var(--muted)] block">{i + 1}</span>
                                                {ans}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startCamera}
                disabled={!selectedEvaluationId}
                className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow"
            >
                <Camera size={24} />
                Abrir Camara
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedEvaluationId}
                className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--on-background)] font-bold text-lg hover:border-[var(--primary)] transition-colors"
            >
                <Download size={24} />
                Subir Imagen
            </motion.button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
            />
        </div>

        {/* Batch Mode Card */}
        <div className="flex items-center justify-between p-5 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl mt-6">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Layers size={20} />
                </div>
                <div>
                    <h4 className="text-[var(--on-background)] font-bold">Modo Rafaga (Batch)</h4>
                    <p className="text-sm text-[var(--muted)]">Escaneo y procesamiento continuo</p>
                </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isBatchMode}
                    onChange={(e) => setIsBatchMode(e.target.checked)}
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-blue-500"></div>
            </label>
        </div>
    </motion.div>
);
