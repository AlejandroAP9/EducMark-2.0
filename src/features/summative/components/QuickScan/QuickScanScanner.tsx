'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera,
    Download,
    RotateCcw,
    Send,
    XCircle,
    AlertTriangle,
    CheckCircle2,
    Eye,
    ScanLine,
    CameraOff,
    ZoomIn,
    ZoomOut,
    FlipHorizontal,
    ClipboardCheck,
    Layers,
} from 'lucide-react';
import type { CorrectAnswers, OMRScanResult } from '../../types/omrScanner';
import {
    compressDataUrl,
    fetchWithTimeout,
    recalculateScore,
    getApiCandidatesLazy,
    joinBaseAndPath,
    parseJsonText,
    buildErrorMessage,
    PROCESSING_STEPS,
    analyzeImageQuality,
} from '../../services/omrProcessing';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

type ScannerPhase = 'idle' | 'camera' | 'preview' | 'processing' | 'results';

interface QuickScanScannerProps {
    title: string;
    totalTF: number;
    totalMC: number;
    correctAnswers: CorrectAnswers;
    mcOptions: 4 | 5;
    onNewAnswerKey: () => void;
    onStepChange: (step: 'scanner' | 'results') => void;
}

export const QuickScanScanner: React.FC<QuickScanScannerProps> = ({
    title,
    totalTF,
    totalMC,
    correctAnswers,
    mcOptions,
    onNewAnswerKey,
    onStepChange,
}) => {
    const [phase, setPhase] = useState<ScannerPhase>('idle');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [qualityWarning, setQualityWarning] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [processingStep, setProcessingStep] = useState(0);
    const [result, setResult] = useState<OMRScanResult | null>(null);
    const [scanCount, setScanCount] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const saveResultToDB = useCallback(async () => {
        if (!result?.data?.score || saving) return;
        setSaving(true);
        try {
            const supabase = createClient();
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData?.user?.id;
            if (!userId) throw new Error('No autenticado');

            const { error: insertError } = await supabase.from('omr_results').insert({
                user_id: userId,
                scan_type: 'quick',
                evaluation_id: null,
                student_name: '',
                student_id: null,
                answers: result.data.answers,
                score: result.data.score,
                answer_key: correctAnswers,
                debug_info: result.data.debug_info || null,
            });

            if (insertError) throw insertError;
            setSaved(true);
            toast.success('Resultado guardado correctamente');
        } catch (err) {
            console.error('[QuickScan] Error saving:', err);
            toast.error('Error al guardar resultado');
        } finally {
            setSaving(false);
        }
    }, [result, saving, correctAnswers]);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const facingModeRef = useRef<'environment' | 'user'>('environment');

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }, []);

    const startCamera = useCallback(async () => {
        setError(null);
        setCapturedImage(null);
        setResult(null);
        setQualityWarning(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingModeRef.current,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(() => {});
            }
            setPhase('camera');
        } catch (err) {
            console.error('Camera error:', err);
            setError('No se pudo acceder a la camara. Verifica los permisos del navegador.');
        }
    }, []);

    const flipCamera = useCallback(() => {
        facingModeRef.current =
            facingModeRef.current === 'environment' ? 'user' : 'environment';
        stopCamera();
        startCamera();
    }, [stopCamera, startCamera]);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement('canvas');
        if (!canvasRef.current) canvasRef.current = canvas;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0);

        const warning = analyzeImageQuality(canvas);
        setQualityWarning(warning);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedImage(dataUrl);
        stopCamera();
        setPhase('preview');
    }, [stopCamera]);

    const handleFileUpload = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result as string;
                setCapturedImage(dataUrl);
                setPhase('preview');
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        },
        []
    );

    const retake = useCallback(() => {
        setCapturedImage(null);
        setError(null);
        setQualityWarning(null);
        setResult(null);
        setPhase('idle');
    }, []);

    const processImage = useCallback(async () => {
        if (!capturedImage) return;
        setPhase('processing');
        setProcessingStep(0);
        setError(null);
        onStepChange('scanner');

        // Animate processing steps
        const stepInterval = setInterval(() => {
            setProcessingStep((s) => (s < PROCESSING_STEPS.length - 1 ? s + 1 : s));
        }, 2000);

        try {
            const compressed = await compressDataUrl(capturedImage);
            const candidates = getApiCandidatesLazy();

            if (candidates.length === 0) {
                throw new Error(
                    'NEXT_PUBLIC_ASSESSMENT_API_URL no esta definida. Configura la variable de entorno.'
                );
            }

            // Get Supabase auth token (same as original scanner)
            const supabase = createClient();
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

            let lastError: Error | null = null;

            for (const base of candidates) {
                try {
                    const url = joinBaseAndPath(base, '/api/v1/omr/process-base64');
                    const jsonPayload = JSON.stringify({
                        image_base64: compressed,
                        total_questions: totalTF + totalMC,
                        question_type: 'mc',
                        correct_answers_json: JSON.stringify(correctAnswers),
                    });

                    const response = await fetchWithTimeout(
                        url,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...authHeader },
                            body: jsonPayload,
                        },
                        60000
                    );

                    const text = await response.text();

                    if (!response.ok) {
                        const parsed = parseJsonText<{ detail?: string }>(text, 'error-response');
                        throw new Error(
                            parsed.detail || `HTTP ${response.status}: ${response.statusText}`
                        );
                    }

                    const scanResult = parseJsonText<OMRScanResult>(text, 'success-response');

                    // Recalculate score with our correct answers
                    if (scanResult.data?.answers) {
                        scanResult.data.score = recalculateScore(
                            scanResult.data.answers,
                            correctAnswers
                        );
                    }

                    clearInterval(stepInterval);
                    setProcessingStep(PROCESSING_STEPS.length - 1);
                    setResult(scanResult);
                    setScanCount((c) => c + 1);
                    setPhase('results');
                    onStepChange('results');
                    return;
                } catch (err) {
                    lastError = err instanceof Error ? err : new Error(String(err));
                    console.warn(`[QuickScan] API candidate ${base} failed:`, lastError.message);
                }
            }

            throw lastError || new Error('Todos los servidores fallaron.');
        } catch (err) {
            clearInterval(stepInterval);
            const message =
                err instanceof Error
                    ? buildErrorMessage('QuickScan', err.message, err.name, '')
                    : String(err);
            setError(message);
            setPhase('preview');
        }
    }, [capturedImage, totalTF, totalMC, correctAnswers, mcOptions, onStepChange]);

    const scanAnother = useCallback(() => {
        setCapturedImage(null);
        setError(null);
        setQualityWarning(null);
        setResult(null);
        setSaved(false);
        setPhase('idle');
        onStepChange('scanner');
    }, [onStepChange]);

    // Derived data for results
    const displayedScore = result?.data?.score;
    const displayedAnswers = result?.data?.answers;
    const passed = displayedScore ? displayedScore.percentage >= 60 : false;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <AnimatePresence mode="wait">
                {/* ── IDLE PHASE ── */}
                {phase === 'idle' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="glass-card-premium p-6 md:p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                        <ScanLine size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-[var(--on-background)]">
                                            Escanear Hojas
                                        </h2>
                                        <p className="text-sm text-[var(--muted)]">
                                            {title || 'Correccion Rapida'} &middot;{' '}
                                            {totalTF + totalMC} preguntas
                                        </p>
                                    </div>
                                </div>

                                {scanCount > 0 && (
                                    <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                        <p className="text-sm text-emerald-300 font-medium flex items-center gap-2">
                                            <Layers size={16} />
                                            {scanCount}{' '}
                                            {scanCount === 1 ? 'hoja escaneada' : 'hojas escaneadas'}{' '}
                                            con esta pauta
                                        </p>
                                    </div>
                                )}

                                <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-3">
                                    <AlertTriangle
                                        size={18}
                                        className="text-amber-400 mt-0.5 flex-shrink-0"
                                    />
                                    <p className="text-sm text-amber-300/80">
                                        Usa la hoja de respuestas estandar de EducMark. Buena
                                        iluminacion y enfoque mejoran la precision.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={startCamera}
                                className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow"
                            >
                                <Camera size={24} />
                                Abrir Camara
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => fileInputRef.current?.click()}
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

                        {/* New Answer Key button */}
                        <button
                            onClick={onNewAnswerKey}
                            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[var(--muted)] text-sm font-medium hover:text-[var(--on-background)] hover:bg-[var(--input-bg)] border border-transparent hover:border-[var(--border)] transition-all"
                        >
                            <ClipboardCheck size={16} />
                            Cambiar pauta de correccion
                        </button>

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                                <XCircle
                                    size={20}
                                    className="text-rose-400 mt-0.5 flex-shrink-0"
                                />
                                <p className="text-sm text-rose-300">{error}</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── CAMERA PHASE ── */}
                {phase === 'camera' && (
                    <motion.div
                        key="camera"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative w-full max-w-3xl mx-auto"
                    >
                        <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-auto"
                                style={{
                                    transform: zoom > 1 ? `scale(${zoom})` : undefined,
                                }}
                            />

                            {/* Overlay with corner markers */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0 bg-black/30"></div>
                                <div
                                    className="absolute top-[8%] left-[6%] right-[6%] bottom-[8%] bg-transparent border-2 border-dashed border-white/50 rounded-lg"
                                    style={{
                                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    {/* Corner markers */}
                                    {[
                                        '-top-1 -left-1',
                                        '-top-1 -right-1',
                                        '-bottom-1 -left-1',
                                        '-bottom-1 -right-1',
                                    ].map((pos, idx) => (
                                        <div key={idx} className={`absolute ${pos}`}>
                                            <div className="w-8 h-8 border-2 border-cyan-400 bg-cyan-400/10 flex items-center justify-center">
                                                <div className="w-4 h-4 bg-cyan-400/30"></div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Scan line animation */}
                                    <motion.div
                                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                        }}
                                    />
                                </div>

                                <div className="absolute top-[13%] left-0 right-0 text-center pointer-events-none z-10">
                                    <span className="px-4 py-2 bg-black/70 text-white rounded-full text-sm backdrop-blur-sm font-medium inline-block max-w-[90%] shadow-lg">
                                        Alinee los 4 cuadrados negros con las esquinas
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Camera Controls */}
                        <div className="flex items-center justify-center gap-4 mt-6">
                            <button
                                onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
                                className="p-3 rounded-full bg-[var(--input-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--on-background)] transition-colors"
                                disabled={zoom <= 1}
                            >
                                <ZoomOut size={20} />
                            </button>

                            <button
                                onClick={flipCamera}
                                className="p-3 rounded-full bg-[var(--input-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--on-background)] transition-colors"
                            >
                                <FlipHorizontal size={20} />
                            </button>

                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={capturePhoto}
                                className="w-16 h-16 rounded-full bg-white border-4 border-cyan-400 shadow-lg shadow-cyan-400/30 flex items-center justify-center hover:bg-cyan-50 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300"></div>
                            </motion.button>

                            <button
                                onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
                                className="p-3 rounded-full bg-[var(--input-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--on-background)] transition-colors"
                                disabled={zoom >= 3}
                            >
                                <ZoomIn size={20} />
                            </button>

                            <button
                                onClick={() => {
                                    stopCamera();
                                    retake();
                                }}
                                className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                            >
                                <CameraOff size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── PREVIEW PHASE ── */}
                {phase === 'preview' && (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
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
                                <AlertTriangle
                                    size={20}
                                    className="text-amber-400 mt-0.5 flex-shrink-0"
                                />
                                <div>
                                    <p className="text-sm text-amber-300 font-medium">
                                        {qualityWarning}
                                    </p>
                                    <p className="text-xs text-amber-300/60 mt-1">
                                        Puede continuar, pero la precision podria verse afectada.
                                    </p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                                <XCircle
                                    size={20}
                                    className="text-rose-400 mt-0.5 flex-shrink-0"
                                />
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
                )}

                {/* ── PROCESSING PHASE ── */}
                {phase === 'processing' && (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full text-center py-16 px-8 glass-card-premium rounded-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                            className="inline-block mb-6 relative z-10"
                        >
                            <div className="w-20 h-20 rounded-full border border-[var(--border)] bg-[var(--input-bg)] flex items-center justify-center relative shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400"></div>
                                <ScanLine size={32} className="text-cyan-400" />
                            </div>
                        </motion.div>

                        <h3 className="text-2xl md:text-3xl font-bold text-[var(--on-background)] mb-3 relative z-10">
                            Procesando hoja de respuestas...
                        </h3>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={processingStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center justify-center gap-2 mb-8 relative z-10"
                            >
                                <span className="text-2xl">
                                    {PROCESSING_STEPS[processingStep]?.icon}
                                </span>
                                <span className="text-[var(--muted)] text-lg font-medium">
                                    {PROCESSING_STEPS[processingStep]?.text}
                                </span>
                            </motion.div>
                        </AnimatePresence>

                        <div className="flex items-center justify-center gap-2 mb-8 relative z-10">
                            {PROCESSING_STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                        i === processingStep
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
                                Motor OMR v2.1 &middot; Vision Artificial
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ── RESULTS PHASE ── */}
                {phase === 'results' && result?.data && displayedScore && displayedAnswers && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Score Hero */}
                        <div
                            className={`glass-card-premium p-8 relative overflow-hidden text-center ${
                                passed ? 'border-emerald-500/20' : 'border-rose-500/20'
                            }`}
                            style={{ borderWidth: '1px', borderStyle: 'solid' }}
                        >
                            <div
                                className={`absolute inset-0 ${
                                    passed ? 'bg-emerald-500/3' : 'bg-rose-500/3'
                                }`}
                            ></div>
                            <div className="relative z-10">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 200,
                                        delay: 0.2,
                                    }}
                                    className="inline-block mb-4"
                                >
                                    {passed ? (
                                        <CheckCircle2
                                            size={56}
                                            className="text-emerald-400"
                                        />
                                    ) : (
                                        <XCircle size={56} className="text-rose-400" />
                                    )}
                                </motion.div>

                                <motion.h2
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className={`text-6xl font-black mb-2 ${
                                        passed ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                >
                                    {displayedScore.percentage}%
                                </motion.h2>
                                <p className="text-[var(--muted)] text-lg">
                                    {displayedScore.correct} correctas de{' '}
                                    {displayedScore.total} preguntas
                                </p>
                                {title && (
                                    <p className="text-xs text-[var(--muted)] mt-2">
                                        {title} &middot; Hoja #{scanCount}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Score Breakdown */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="glass-card-premium p-5 text-center">
                                <p className="text-3xl font-bold text-emerald-400">
                                    {displayedScore.correct}
                                </p>
                                <p className="text-sm text-[var(--muted)] mt-1">Correctas</p>
                            </div>
                            <div className="glass-card-premium p-5 text-center">
                                <p className="text-3xl font-bold text-rose-400">
                                    {displayedScore.incorrect}
                                </p>
                                <p className="text-sm text-[var(--muted)] mt-1">Incorrectas</p>
                            </div>
                            <div className="glass-card-premium p-5 text-center">
                                <p className="text-3xl font-bold text-amber-400">
                                    {displayedScore.blank}
                                </p>
                                <p className="text-sm text-[var(--muted)] mt-1">En Blanco</p>
                            </div>
                        </div>

                        {/* Detected Answers */}
                        <div className="glass-card-premium p-6 md:p-8">
                            <h3 className="text-xl font-bold text-[var(--on-background)] mb-6 flex items-center gap-2">
                                <Eye size={20} className="text-cyan-400" />
                                Respuestas Detectadas
                            </h3>

                            {displayedAnswers.tf.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-[var(--muted)] mb-3 uppercase tracking-wider">
                                        Verdadero / Falso
                                    </h4>
                                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                        {displayedAnswers.tf.map((ans, i) => {
                                            const isCorrect =
                                                correctAnswers.tf[i] === ans;
                                            const isBlank = ans === null;
                                            return (
                                                <div
                                                    key={`result-tf-${i}`}
                                                    className={`p-2 text-center rounded-lg border text-sm font-bold ${
                                                        isBlank
                                                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                            : isCorrect
                                                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                                              : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                                                    }`}
                                                >
                                                    <span className="text-[10px] text-[var(--muted)] block">
                                                        {i + 1}
                                                    </span>
                                                    {isBlank ? '\u2014' : ans}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {displayedAnswers.mc.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-[var(--muted)] mb-3 uppercase tracking-wider">
                                        Seleccion Multiple
                                    </h4>
                                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                        {displayedAnswers.mc.map((ans, i) => {
                                            const isCorrect =
                                                correctAnswers.mc[i] === ans;
                                            const isBlank = ans === null;
                                            return (
                                                <div
                                                    key={`result-mc-${i}`}
                                                    className={`p-2 text-center rounded-lg border text-sm font-bold ${
                                                        isBlank
                                                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                            : isCorrect
                                                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                                              : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                                                    }`}
                                                >
                                                    <span className="text-[10px] text-[var(--muted)] block">
                                                        {i + 1}
                                                    </span>
                                                    {isBlank ? '\u2014' : ans}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Save Button */}
                        {!saved ? (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={saveResultToDB}
                                disabled={saving}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-shadow disabled:opacity-50"
                            >
                                <Save size={18} />
                                {saving ? 'Guardando...' : 'Guardar resultado'}
                            </motion.button>
                        ) : (
                            <div className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                                <CheckCircle2 size={18} />
                                Resultado guardado
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={scanAnother}
                                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow"
                            >
                                <RotateCcw size={18} />
                                Escanear otra hoja
                            </motion.button>
                            <button
                                onClick={onNewAnswerKey}
                                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--on-background)] font-semibold hover:border-[var(--primary)] transition-colors"
                            >
                                <ClipboardCheck size={18} />
                                Nueva pauta
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
