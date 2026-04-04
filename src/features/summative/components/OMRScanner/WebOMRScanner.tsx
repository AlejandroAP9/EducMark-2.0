'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { logAuditEvent } from '@/shared/lib/auditLog';
import { decryptQRData, type QRData } from '../AnswerSheet/QRCodeGenerator';

import type {
    OMRScanResult,
    CorrectAnswers,
    WebOMRScannerProps,
    Phase,
    EvaluationOption,
    PendingScanRequest,
    PendingResultPayload,
    BarcodeDetectorCtorLike,
} from '../../types/omrScanner';

import {
    OMR_PENDING_REQUESTS_KEY,
    OMR_PENDING_RESULTS_KEY,
    DEFAULT_API_BASE,
    getApiCandidatesLazy,
    formatApiLabel,
    joinBaseAndPath,
    parseJsonText,
    compressDataUrl,
    dataUrlToBlob,
    analyzeImageQuality,
    recalculateScore as recalculateScorePure,
    fetchWithTimeout,
    PROCESSING_STEPS,
    buildErrorMessage,
} from '../../services/omrProcessing';

import { SetupPhase, CameraPhase, PreviewPhase, ProcessingPhase, ResultPhase } from './phases';

export const WebOMRScanner: React.FC<WebOMRScannerProps> = ({ onBack, onOpenFeedback }) => {
    const supabase = createClient();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [phase, setPhase] = useState<Phase>('setup');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [result, setResult] = useState<OMRScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [zoom, setZoom] = useState(1);

    const [totalTF, setTotalTF] = useState(10);
    const [totalMC, setTotalMC] = useState(40);
    const [correctAnswers, setCorrectAnswers] = useState<CorrectAnswers>({ tf: [], mc: [] });
    const [showAnswerConfig, setShowAnswerConfig] = useState(false);
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
    const [evaluations, setEvaluations] = useState<EvaluationOption[]>([]);
    const [selectedEvaluationId, setSelectedEvaluationId] = useState<string>('');
    const [pendingRequests, setPendingRequests] = useState<PendingScanRequest[]>([]);
    const [pendingResults, setPendingResults] = useState<PendingResultPayload[]>([]);
    const [syncingQueue, setSyncingQueue] = useState(false);
    const [activeApiBase, setActiveApiBase] = useState<string>(DEFAULT_API_BASE);
    const [studentName, setStudentName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [savedResultId, setSavedResultId] = useState<string | null>(null);
    const [savedAsDuplicate, setSavedAsDuplicate] = useState(false);
    const [manualAnswers, setManualAnswers] = useState<{ tf: (string | null)[]; mc: (string | null)[] } | null>(null);
    const [manualScore, setManualScore] = useState<NonNullable<OMRScanResult['data']>['score'] | null>(null);
    const [qrPayload, setQrPayload] = useState<QRData | null>(null);
    const [qualityWarning, setQualityWarning] = useState<string | null>(null);
    const [processingStep, setProcessingStep] = useState(0);

    // ── Effects ──

    useEffect(() => {
        setCorrectAnswers({
            tf: Array(totalTF).fill('V'),
            mc: Array(totalMC).fill('A'),
        });
    }, [totalTF, totalMC]);

    useEffect(() => {
        if (!selectedEvaluationId) return;
        const loadAnswerKey = async () => {
            try {
                const { data: items, error } = await supabase
                    .from('evaluation_items')
                    .select('type, correct_answer')
                    .eq('evaluation_id', selectedEvaluationId)
                    .order('created_at', { ascending: true });

                if (error || !items || items.length === 0) return;

                const tfAnswers: string[] = [];
                const mcAnswers: string[] = [];

                items.forEach(item => {
                    const answer = item.correct_answer || '';
                    const type = (item.type || '').toLowerCase();
                    if (type.includes('verdadero') || type.includes('falso') || type === 'tf') {
                        tfAnswers.push(answer.toUpperCase() === 'V' || answer.toUpperCase() === 'VERDADERO' ? 'V' : 'F');
                    } else if (type.includes('selecci') || type.includes('multiple') || type === 'mc') {
                        mcAnswers.push(answer.toUpperCase());
                    }
                });

                if (tfAnswers.length > 0 || mcAnswers.length > 0) {
                    setTotalTF(tfAnswers.length);
                    setTotalMC(mcAnswers.length);
                    setCorrectAnswers({ tf: tfAnswers, mc: mcAnswers });
                    console.log(`[OMR] Pauta auto-cargada: ${tfAnswers.length} V/F + ${mcAnswers.length} SM`);
                }
            } catch (err) {
                console.error('[OMR] Error loading answer key:', err);
            }
        };
        loadAnswerKey();
    }, [selectedEvaluationId]);

    useEffect(() => {
        try {
            const savedRequests = localStorage.getItem(OMR_PENDING_REQUESTS_KEY);
            const savedResults = localStorage.getItem(OMR_PENDING_RESULTS_KEY);
            if (savedRequests) setPendingRequests(JSON.parse(savedRequests));
            if (savedResults) setPendingResults(JSON.parse(savedResults));
        } catch (error) {
            console.error('[OMR] Error loading offline queue:', error);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(OMR_PENDING_REQUESTS_KEY, JSON.stringify(pendingRequests));
    }, [pendingRequests]);

    useEffect(() => {
        localStorage.setItem(OMR_PENDING_RESULTS_KEY, JSON.stringify(pendingResults));
    }, [pendingResults]);

    // ── Callbacks ──

    const persistScanResult = useCallback(async (
        resultData: OMRScanResult['data'],
        evaluationId: string,
        student?: { name?: string | null; id?: string | null }
    ) => {
        if (!resultData) return;
        const normalizedStudentName = (student?.name ?? studentName).trim() || null;
        const normalizedStudentId = (student?.id ?? studentId).trim() || null;
        let existingId: string | null = null;

        if (normalizedStudentId || normalizedStudentName) {
            let query = supabase.from('omr_results').select('id').eq('evaluation_id', evaluationId).limit(1);
            if (normalizedStudentId) {
                query = query.eq('student_id', normalizedStudentId);
            } else if (normalizedStudentName) {
                query = query.eq('student_name', normalizedStudentName);
            }
            const { data: existingRows, error: existingError } = await query;
            if (existingError) throw existingError;
            existingId = existingRows?.[0]?.id || null;
        }

        const payload = {
            evaluation_id: evaluationId,
            student_name: normalizedStudentName,
            student_id: normalizedStudentId,
            answers: resultData.answers,
            score: resultData.score,
            captured_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        if (existingId) {
            const { error: updateError } = await supabase.from('omr_results').update(payload).eq('id', existingId);
            if (updateError) throw updateError;
            setSavedAsDuplicate(true);
            setSavedResultId(existingId);
            return { id: existingId, wasDuplicate: true };
        }

        const { data: insertedRow, error: insertError } = await supabase.from('omr_results').insert(payload).select('id').single();
        if (insertError) throw insertError;
        const insertedId = insertedRow?.id || null;
        setSavedAsDuplicate(false);
        setSavedResultId(insertedId);
        return { id: insertedId, wasDuplicate: false };
    }, [studentId, studentName]);

    const queueResultForSync = useCallback((resultData: OMRScanResult['data'], evaluationId: string) => {
        if (!resultData) return;
        setPendingResults((prev) => [
            ...prev,
            {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                createdAt: new Date().toISOString(),
                evaluationId,
                answers: resultData.answers,
                score: resultData.score,
                studentName: studentName.trim() || null,
                studentId: studentId.trim() || null,
            }
        ]);
    }, [studentId, studentName]);

    const fetchApi = useCallback(async (path: string, options: RequestInit, timeoutMs = 30000) => {
        const candidates = getApiCandidatesLazy();
        if (candidates.length === 0) {
            throw new Error('No hay endpoint de API valido. Define NEXT_PUBLIC_ASSESSMENT_API_URL en las variables de entorno.');
        }
        const isConnError = (message: string) =>
            /(load failed|failed to fetch|network|network request failed|fetch failed|aborted|timeout|dns|string did not match the expected pattern)/i.test(message);

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const optionsWithAuth: RequestInit = {
            ...options,
            headers: { ...authHeader, ...(options.headers as Record<string, string> | undefined) },
        };

        let lastError: unknown = null;
        for (const base of candidates) {
            try {
                const endpoint = joinBaseAndPath(base, path);
                const response = await fetchWithTimeout(endpoint, optionsWithAuth, timeoutMs);
                if (response.status === 404 || response.status === 502 || response.status === 503 || response.status === 504) {
                    lastError = new Error(`HTTP ${response.status} en ${formatApiLabel(base)}`);
                    continue;
                }
                setActiveApiBase(base);
                return response;
            } catch (err) {
                lastError = err;
                const message = err instanceof Error ? err.message : String(err);
                if (!isConnError(message)) throw err;
            }
        }
        throw new Error(`OMR_ALL_HOSTS_FAILED: No se pudo conectar al servidor de evaluacion. Verifica tu conexion. Detalles: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
    }, [supabase]);

    const parseJsonResponse = useCallback(async <T,>(response: Response, context: string): Promise<T> => {
        const raw = await response.text();
        return parseJsonText<T>(raw, context);
    }, []);

    const detectQRCodePayload = useCallback(async (blob: Blob): Promise<QRData | null> => {
        const detectorCtor = (window as typeof window & { BarcodeDetector?: BarcodeDetectorCtorLike }).BarcodeDetector;
        if (!detectorCtor) return null;

        const ua = navigator.userAgent || '';
        const isIOSWebKit = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && 'ontouchend' in document);
        if (isIOSWebKit) return null;

        let bitmap: ImageBitmap | null = null;
        try {
            if (typeof detectorCtor.getSupportedFormats === 'function') {
                const supportedFormats = await detectorCtor.getSupportedFormats();
                if (!supportedFormats.includes('qr_code')) return null;
            }
            bitmap = await createImageBitmap(blob);
            const detector = new detectorCtor({ formats: ['qr_code'] });
            const barcodes = await detector.detect(bitmap);
            const rawValue = barcodes?.[0]?.rawValue;
            if (!rawValue) return null;
            return decryptQRData(rawValue);
        } catch (qrErr) {
            console.warn('[OMR] QR detect failed:', qrErr);
            return null;
        } finally {
            bitmap?.close();
        }
    }, []);

    const syncPending = useCallback(async () => {
        if (!navigator.onLine || syncingQueue) return;
        if (pendingRequests.length === 0 && pendingResults.length === 0) return;

        setSyncingQueue(true);
        try {
            let remainingRequests = [...pendingRequests];
            for (const queued of pendingRequests) {
                try {
                    const jsonPayload = JSON.stringify({
                        image_base64: queued.imageDataUrl,
                        total_questions: queued.totalTF + queued.totalMC,
                        question_type: 'mc',
                        correct_answers_json: JSON.stringify(queued.correctAnswers)
                    });
                    const response = await fetchApi('/api/v1/omr/process-base64', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: new TextEncoder().encode(jsonPayload),
                    }, 30000);
                    if (!response.ok) throw new Error(`Sync API failed (${response.status})`);
                    const rawResponse = await response.text();
                    const data: OMRScanResult = parseJsonText<OMRScanResult>(rawResponse, 'sync-success-response');
                    await persistScanResult(data.data, queued.evaluationId, { name: queued.studentName, id: queued.studentId });
                    remainingRequests = remainingRequests.filter((item) => item.id !== queued.id);
                } catch (error) {
                    console.error('[OMR] Pending request sync failed:', error);
                }
            }
            setPendingRequests(remainingRequests);

            let remainingResults = [...pendingResults];
            for (const queuedResult of pendingResults) {
                try {
                    let existingId: string | null = null;
                    if (queuedResult.studentId || queuedResult.studentName) {
                        let query = supabase.from('omr_results').select('id').eq('evaluation_id', queuedResult.evaluationId).limit(1);
                        if (queuedResult.studentId) query = query.eq('student_id', queuedResult.studentId);
                        else if (queuedResult.studentName) query = query.eq('student_name', queuedResult.studentName);
                        const { data: existingRows, error: existingError } = await query;
                        if (existingError) throw existingError;
                        existingId = existingRows?.[0]?.id || null;
                    }
                    const payload = {
                        evaluation_id: queuedResult.evaluationId,
                        student_name: queuedResult.studentName,
                        student_id: queuedResult.studentId,
                        answers: queuedResult.answers,
                        score: queuedResult.score,
                        captured_at: queuedResult.createdAt,
                        updated_at: new Date().toISOString(),
                    };
                    if (existingId) {
                        const { error: updateError } = await supabase.from('omr_results').update(payload).eq('id', existingId);
                        if (updateError) throw updateError;
                    } else {
                        const { error: insertError } = await supabase.from('omr_results').insert(payload);
                        if (insertError) throw insertError;
                    }
                    remainingResults = remainingResults.filter((item) => item.id !== queuedResult.id);
                } catch (error) {
                    console.error('[OMR] Pending result sync failed:', error);
                }
            }
            setPendingResults(remainingResults);

            if (pendingRequests.length > 0 || pendingResults.length > 0) {
                toast.success('Sincronizacion OMR completada.');
            }
        } finally {
            setSyncingQueue(false);
        }
    }, [dataUrlToBlob, pendingRequests, pendingResults, persistScanResult, syncingQueue]);

    useEffect(() => {
        const handleOnline = () => { setIsOnline(true); syncPending(); };
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
    }, [syncPending]);

    useEffect(() => {
        const loadEvaluations = async () => {
            try {
                const { data: userData } = await supabase.auth.getUser();
                const userId = userData?.user?.id;
                if (!userId) return;
                const { data, error: evalError } = await supabase
                    .from('evaluations')
                    .select('id, title, grade, subject')
                    .eq('user_id', userId)
                    .neq('status', 'archived')
                    .order('created_at', { ascending: false })
                    .limit(50);
                if (evalError) throw evalError;
                const evalRows = (data || []) as EvaluationOption[];
                setEvaluations(evalRows);
                if (evalRows.length > 0) setSelectedEvaluationId(evalRows[0].id);
            } catch (error) {
                console.error('[OMR] Error loading evaluations:', error);
            }
        };
        loadEvaluations();
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => { return () => { stopCamera(); }; }, []);

    const startCamera = useCallback(async () => {
        setError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError('Tu navegador bloqueo el acceso a la camara. Esto suele ocurrir si la pagina no usa HTTPS o necesitas darle permisos manualmente. Por favor, utiliza el boton "Subir Imagen".');
            return;
        }
        try {
            let stream: MediaStream | null = null;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } });
            } catch (e1: unknown) {
                const fallbackErrors = ['OverconstrainedError', 'ConstraintNotSatisfiedError', 'NotReadableError'];
                const e1Name = e1 instanceof Error ? e1.name : '';
                if (fallbackErrors.includes(e1Name)) {
                    try { stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } }); }
                    catch { stream = await navigator.mediaDevices.getUserMedia({ video: true }); }
                } else { throw e1; }
            }
            streamRef.current = stream;
            if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
            setPhase('camera');
        } catch (err: unknown) {
            console.error('[OMR] Camera error:', err);
            const errName = err instanceof Error ? err.name : '';
            const errMessage = err instanceof Error ? err.message : 'Desconocido';
            if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') setError('Permiso denegado para acceder a la camara. Por favor autoriza el acceso en tu navegador.');
            else if (errName === 'NotFoundError') setError('No se detecto ninguna camara en este dispositivo.');
            else setError(`Error de camara: ${errMessage}. Verifica los permisos o intenta "Subir Imagen".`);
        }
    }, [facingMode]);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const MAX_DIMENSION = 1280;
        let finalWidth = video.videoWidth;
        let finalHeight = video.videoHeight;
        if (finalWidth > MAX_DIMENSION || finalHeight > MAX_DIMENSION) {
            const ratio = Math.min(MAX_DIMENSION / finalWidth, MAX_DIMENSION / finalHeight);
            finalWidth = Math.floor(finalWidth * ratio);
            finalHeight = Math.floor(finalHeight * ratio);
        }
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        if (zoom > 1) {
            const cropW = video.videoWidth / zoom;
            const cropH = video.videoHeight / zoom;
            const cropX = (video.videoWidth - cropW) / 2;
            const cropY = (video.videoHeight - cropH) / 2;
            ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, finalWidth, finalHeight);
        } else {
            ctx.drawImage(video, 0, 0, finalWidth, finalHeight);
        }
        const warning = analyzeImageQuality(canvas);
        setQualityWarning(warning);
        canvas.toBlob((blob) => {
            if (blob) {
                setCapturedBlob(blob);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
                setCapturedImage(dataUrl);
                stopCamera();
                if (isBatchMode && !warning) { processImage(blob); }
                else { setPhase('preview'); }
            }
        }, 'image/jpeg', 0.80);
    }, [zoom, stopCamera, isBatchMode]);

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona una imagen valida (PNG, JPG, etc.)');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        if (file.size > 15 * 1024 * 1024) {
            toast.error('El archivo es muy grande. El tamano maximo permitido es 15MB.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        setCapturedBlob(file);
        const reader = new FileReader();
        reader.onload = (event) => { setCapturedImage(event.target?.result as string); setPhase('preview'); };
        reader.readAsDataURL(file);
    }, []);

    const retake = useCallback(() => {
        setCapturedImage(null); setCapturedBlob(null); setResult(null); setError(null);
        setSavedResultId(null); setSavedAsDuplicate(false); setManualAnswers(null);
        setManualScore(null); setQrPayload(null); setPhase('setup');
    }, []);

    const isProcessingRef = useRef(false);

    const processImage = useCallback(async (autoBlob?: Blob) => {
        const blobToProcess = autoBlob || capturedBlob;
        if (!blobToProcess) return;
        if (isProcessingRef.current) { toast.info('Procesamiento en curso, espera a que termine.'); return; }
        isProcessingRef.current = true;
        let stage = 'init';
        setPhase('processing');
        setError(null);

        try {
            stage = 'connectivity-check';
            if (!navigator.onLine) {
                setError(`Sin conexion a internet. Verifica red movil/Wi-Fi e intenta nuevamente para procesar con ${formatApiLabel(activeApiBase)}.`);
                setPhase('preview');
                return;
            }

            let effectiveEvaluationId = selectedEvaluationId;
            let effectiveAnswers = correctAnswers;
            let effectiveTF = totalTF;
            let effectiveMC = totalMC;

            stage = 'qr-detection';
            let detectedQR: QRData | null = null;
            try { detectedQR = await detectQRCodePayload(blobToProcess); }
            catch (qrError) { console.warn('[OMR] QR pre-read skipped:', qrError); }

            if (detectedQR?.id && detectedQR?.answers) {
                const normalizedAnswers: CorrectAnswers = {
                    tf: Array.isArray(detectedQR.answers.tf) ? [...detectedQR.answers.tf] : [],
                    mc: Array.isArray(detectedQR.answers.mc) ? [...detectedQR.answers.mc] : [],
                };
                setQrPayload(detectedQR);
                setSelectedEvaluationId(detectedQR.id);
                setCorrectAnswers(normalizedAnswers);
                setTotalTF(normalizedAnswers.tf.length);
                setTotalMC(normalizedAnswers.mc.length);
                effectiveEvaluationId = detectedQR.id;
                effectiveAnswers = normalizedAnswers;
                effectiveTF = normalizedAnswers.tf.length;
                effectiveMC = normalizedAnswers.mc.length;
                toast.success(`QR detectado: pauta cargada automaticamente (${detectedQR.subject} · ${detectedQR.grade})`);
            }

            if (!effectiveEvaluationId) {
                toast.error('Selecciona una evaluacion antes de procesar escaneos.');
                setPhase('preview');
                return;
            }

            stage = 'ping-test';
            try {
                const pingRes = await fetchApi('/api/v1/omr/ping-post', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ test: "hello", info: "OMR pre-flight ping" })
                }, 5000);
                await pingRes.text();
            } catch (pingErr) {
                console.error('[OMR] Ping Test FALLO:', pingErr);
            }

            stage = 'build-payload';
            let reqOptions: RequestInit;
            let targetEndpoint: string;
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && 'ontouchend' in document);

            if (isIOS && capturedImage) {
                stage = 'compress-image';
                const compressedImage = await compressDataUrl(capturedImage);
                stage = 'build-payload';
                targetEndpoint = '/api/v1/omr/process-base64';
                reqOptions = {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image_base64: compressedImage, total_questions: effectiveTF + effectiveMC, question_type: 'mc', correct_answers_json: JSON.stringify(effectiveAnswers) })
                };
            } else {
                const formData = new FormData();
                formData.append('file', blobToProcess, 'omr_scan.jpg');
                formData.append('total_questions', String(effectiveTF + effectiveMC));
                formData.append('question_type', 'mc');
                formData.append('correct_answers_json', JSON.stringify(effectiveAnswers));
                targetEndpoint = '/api/v1/omr/process-image';
                reqOptions = { method: 'POST', body: formData };
            }

            const MAX_RETRIES = 3;
            let response: Response | null = null;
            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                try {
                    stage = `api-request-attempt-${attempt + 1}`;
                    response = await fetchApi(targetEndpoint, reqOptions, 30000);
                    if (response.ok) break;
                    if (response.status < 500) break;
                } catch (fetchErr: unknown) {
                    if (attempt === MAX_RETRIES - 1) throw fetchErr;
                }
                await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
            }

            stage = 'parse-response';
            if (!response || !response.ok) {
                const errData = response ? await parseJsonResponse<{ detail?: string }>(response, 'error-response').catch(() => null) : null;
                throw new Error(errData?.detail || `Error del servidor (${response?.status || 'timeout'})`);
            }

            const data: OMRScanResult = await parseJsonResponse<OMRScanResult>(response, 'success-response');
            try {
                await persistScanResult(data.data, effectiveEvaluationId);
                logAuditEvent('omr_scan_completed', { evaluationId: effectiveEvaluationId });
            } catch (persistError) {
                console.error('[OMR] Error persisting result, queued for retry:', persistError);
                queueResultForSync(data.data, effectiveEvaluationId);
                toast.info('Resultado leido, pendiente de sincronizacion con la nube.');
            }

            if (data.data?.answers) {
                setManualAnswers({ tf: [...(data.data.answers.tf || [])], mc: [...(data.data.answers.mc || [])] });
                setManualScore(data.data.score || null);
            }

            if (isBatchMode) {
                toast.success(`Leido: ${data.data?.score.percentage}% (${data.data?.score.correct}/${data.data?.score.total})`);
                setResult(data);
                setPhase('result');
                setTimeout(() => { setCapturedImage(null); setCapturedBlob(null); setResult(null); setError(null); startCamera(); }, 2000);
            } else {
                setResult(data);
                setPhase('result');
            }
        } catch (err: unknown) {
            const rawMessage = err instanceof Error ? err.message : 'Error al procesar la imagen';
            const errorName = err instanceof Error ? err.name : 'UnknownError';
            console.error('[OMR] Error:', buildErrorMessage(stage, rawMessage, errorName, activeApiBase));
            setError("No se pudo procesar la hoja. Verifica tu conexion a internet e intentalo nuevamente.");
            setPhase('preview');
            if (isBatchMode) toast.error("No se pudo procesar la hoja. Verifica tu conexion a internet e intentalo nuevamente.");
        } finally {
            isProcessingRef.current = false;
        }
    }, [capturedBlob, capturedImage, correctAnswers, totalTF, totalMC, isBatchMode, startCamera, selectedEvaluationId, persistScanResult, queueResultForSync, fetchApi, activeApiBase, detectQRCodePayload, parseJsonResponse]);

    const flipCamera = useCallback(() => { stopCamera(); setFacingMode(prev => prev === 'environment' ? 'user' : 'environment'); }, [stopCamera]);

    const recalculateScore = useCallback((answersToScore: { tf: (string | null)[]; mc: (string | null)[] }) => {
        return recalculateScorePure(answersToScore, correctAnswers);
    }, [correctAnswers]);

    const persistManualOverride = useCallback(async (
        nextAnswers: { tf: (string | null)[]; mc: (string | null)[] },
        nextScore: { correct: number; incorrect: number; blank: number; total: number; percentage: number }
    ) => {
        if (!savedResultId) return;
        const { error: updateError } = await supabase.from('omr_results').update({
            answers: nextAnswers,
            score: { ...nextScore, manual_override: true, manual_override_at: new Date().toISOString() },
            updated_at: new Date().toISOString(),
        }).eq('id', savedResultId);
        if (updateError) { console.error('[OMR] Error saving manual override:', updateError); toast.error('No se pudo guardar la correccion manual.'); }
    }, [savedResultId]);

    const applyManualOverride = useCallback(async (section: 'tf' | 'mc', questionIndex: number, value: string | null) => {
        if (!manualAnswers) return;
        const nextAnswers = { tf: [...manualAnswers.tf], mc: [...manualAnswers.mc] };
        const target = nextAnswers[section];
        const idx = questionIndex - 1;
        if (idx < 0 || idx >= target.length) return;
        target[idx] = value;
        const nextScore = recalculateScore(nextAnswers);
        setManualAnswers(nextAnswers);
        setManualScore(nextScore);
        await persistManualOverride(nextAnswers, nextScore);
    }, [manualAnswers, persistManualOverride, recalculateScore]);

    useEffect(() => { if (phase === 'camera') startCamera(); }, [facingMode]);

    useEffect(() => {
        if (phase !== 'processing') { setProcessingStep(0); return; }
        const interval = setInterval(() => { setProcessingStep(prev => (prev + 1) % PROCESSING_STEPS.length); }, 1800);
        return () => clearInterval(interval);
    }, [phase]);

    // ── Render ──

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { stopCamera(); onBack(); }}
                        className="p-2 rounded-lg hover:bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--on-background)] transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--on-background)]">Escaner OMR</h1>
                        <p className="text-sm text-[var(--muted)]">
                            {phase === 'setup' && 'Configura y captura'}
                            {phase === 'camera' && 'Posiciona la hoja y captura'}
                            {phase === 'preview' && 'Revisa la captura'}
                            {phase === 'processing' && 'Analizando...'}
                            {phase === 'result' && 'Resultados del escaneo'}
                        </p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-3">
                    <button
                        onClick={syncPending}
                        disabled={!isOnline || syncingQueue || (pendingRequests.length + pendingResults.length) === 0}
                        className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--muted)] disabled:opacity-50"
                    >
                        {syncingQueue ? 'Sincronizando...' : `Sincronizar (${pendingRequests.length + pendingResults.length})`}
                    </button>
                    {(['setup', 'camera', 'preview', 'processing', 'result'] as Phase[]).map((p, i) => (
                        <div key={p} className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full transition-colors ${phase === p ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50' :
                                (['setup', 'camera', 'preview', 'processing', 'result'].indexOf(phase) > i ? 'bg-cyan-400/40' : 'bg-[var(--border)]')
                                }`} />
                            {i < 4 && <div className="w-6 h-px bg-[var(--border)]" />}
                        </div>
                    ))}
                </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <AnimatePresence mode="wait">
                {phase === 'setup' && (
                    <SetupPhase
                        isOnline={isOnline}
                        pendingRequests={pendingRequests}
                        pendingResults={pendingResults}
                        selectedEvaluationId={selectedEvaluationId}
                        setSelectedEvaluationId={setSelectedEvaluationId}
                        evaluations={evaluations}
                        studentName={studentName}
                        setStudentName={setStudentName}
                        studentId={studentId}
                        setStudentId={setStudentId}
                        showAnswerConfig={showAnswerConfig}
                        setShowAnswerConfig={setShowAnswerConfig}
                        totalTF={totalTF}
                        setTotalTF={setTotalTF}
                        totalMC={totalMC}
                        setTotalMC={setTotalMC}
                        correctAnswers={correctAnswers}
                        setCorrectAnswers={setCorrectAnswers}
                        startCamera={startCamera}
                        fileInputRef={fileInputRef}
                        handleFileUpload={handleFileUpload}
                        isBatchMode={isBatchMode}
                        setIsBatchMode={setIsBatchMode}
                    />
                )}
                {phase === 'camera' && (
                    <CameraPhase
                        videoRef={videoRef}
                        zoom={zoom}
                        setZoom={setZoom}
                        flipCamera={flipCamera}
                        capturePhoto={capturePhoto}
                        stopCamera={stopCamera}
                        retake={retake}
                    />
                )}
                {phase === 'preview' && (
                    <PreviewPhase
                        capturedImage={capturedImage}
                        qualityWarning={qualityWarning}
                        error={error}
                        retake={retake}
                        processImage={() => processImage()}
                    />
                )}
                {phase === 'processing' && (
                    <ProcessingPhase processingStep={processingStep} />
                )}
                {phase === 'result' && result && (
                    <ResultPhase
                        result={result}
                        manualAnswers={manualAnswers}
                        manualScore={manualScore}
                        correctAnswers={correctAnswers}
                        savedResultId={savedResultId}
                        savedAsDuplicate={savedAsDuplicate}
                        qrPayload={qrPayload}
                        selectedEvaluationId={selectedEvaluationId}
                        retake={retake}
                        onBack={onBack}
                        onOpenFeedback={onOpenFeedback}
                        applyManualOverride={applyManualOverride}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
