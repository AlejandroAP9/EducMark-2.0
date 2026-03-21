'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, CameraOff, RotateCcw, Send, ArrowLeft, CheckCircle2, XCircle,
    Loader2, ScanLine, ZoomIn, ZoomOut, FlipHorizontal, Info, Download,
    Eye, AlertTriangle, Layers, Users, BrainCircuit
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { logAuditEvent } from '@/shared/lib/auditLog';
import { decryptQRData, type QRData } from '../AnswerSheet/QRCodeGenerator';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const trimQuotes = (value: string) => value.replace(/^['"]+|['"]+$/g, '');
const stripInvisibleChars = (value: string) =>
    value
        .normalize('NFKC')
        .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '');
const isValidHttpBaseUrl = (value: string) => {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};
const toAbsoluteBase = (value: string) => {
    const sanitized = stripInvisibleChars(trimQuotes(value)).replace(/\s+/g, '').trim();
    if (/^https?:\/\//i.test(sanitized)) return trimTrailingSlash(sanitized);
    if (/^\/\//.test(sanitized) && typeof window !== 'undefined') {
        return trimTrailingSlash(`${window.location.protocol}${sanitized}`);
    }
    // If env contains just host[:port][/path], assume HTTPS by default.
    if (/^[a-z0-9.-]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(sanitized)) {
        return trimTrailingSlash(`https://${sanitized}`);
    }
    if (/^\//.test(sanitized) && typeof window !== 'undefined') {
        return trimTrailingSlash(`${window.location.origin}${sanitized}`);
    }
    if (typeof window !== 'undefined') {
        return trimTrailingSlash(`${window.location.origin}/${sanitized.replace(/^\/+/, '')}`);
    }
    return trimTrailingSlash(sanitized);
};
const getApiCandidates = () => {
    const candidates: string[] = [];
    const fromEnv = process.env.NEXT_PUBLIC_ASSESSMENT_API_URL?.trim();
    if (fromEnv) {
        const normalizedFromEnv = toAbsoluteBase(fromEnv);
        if (isValidHttpBaseUrl(normalizedFromEnv)) {
            candidates.push(normalizedFromEnv);
        } else {
            console.warn('[OMR] Ignorando NEXT_PUBLIC_ASSESSMENT_API_URL invalida:', fromEnv);
        }
    }

    // Si no hay variable de entorno, fallamos limpiamente, sin fallbacks destructivos
    if (candidates.length === 0) {
        console.error('[OMR] CRITICAL ERROR: NEXT_PUBLIC_ASSESSMENT_API_URL no esta definida o es invalida.');
    }

    return Array.from(new Set(candidates.filter(Boolean).map(trimTrailingSlash).filter(isValidHttpBaseUrl)));
};

// Lazy-evaluated: avoids issues with SSR/hydration where env vars aren't ready
let _apiCandidatesCache: string[] | null = null;
const getApiCandidatesLazy = () => {
    if (_apiCandidatesCache === null) _apiCandidatesCache = getApiCandidates();
    return _apiCandidatesCache;
};
const DEFAULT_API_BASE = '';
const formatApiLabel = (base: string) => {
    if (!base) return 'API';
    try {
        return new URL(base).host;
    } catch {
        return base;
    }
};
const joinBaseAndPath = (base: string, path: string) => {
    const normalizedBase = trimTrailingSlash(stripInvisibleChars(base).trim());
    const normalizedPath = stripInvisibleChars(path).startsWith('/') ? stripInvisibleChars(path) : `/${stripInvisibleChars(path)}`;
    return `${normalizedBase}${normalizedPath}`;
};
const OMR_PENDING_REQUESTS_KEY = 'educmark_omr_pending_requests_v1';
const OMR_PENDING_RESULTS_KEY = 'educmark_omr_pending_results_v1';
const OMR_BUILD_TAG = 'OMR-BUILD-20260307C';
const parseJsonText = <T,>(raw: string, context: string): T => {
    const cleaned = stripInvisibleChars(raw).trim();
    if (!cleaned) {
        throw new Error(`[${OMR_BUILD_TAG}] [${context}] Respuesta vacía del backend.`);
    }
    try {
        return JSON.parse(cleaned) as T;
    } catch {
        const preview = cleaned.slice(0, 220).replace(/\s+/g, ' ');
        throw new Error(`[${OMR_BUILD_TAG}] [${context}] Respuesta no es JSON válido. Preview: ${preview}`);
    }
};

interface OMRScanResult {
    success: boolean;
    data?: {
        answers: {
            tf: (string | null)[];
            mc: (string | null)[];
        };
        name_image: string | null;
        score: {
            correct: number;
            incorrect: number;
            blank: number;
            total: number;
            percentage: number;
        };
        confidences?: {
            tf: ConfidenceEntry[];
            mc: ConfidenceEntry[];
        };
        confidence_summary?: {
            average: number;
            high: number;
            low: number;
            blank: number;
            ambiguous: number;
        };
        low_confidence_items?: LowConfidenceItem[];
        needs_review?: boolean;
        debug_info: string;
    };
    error?: string;
}

interface ConfidenceEntry {
    confidence: number;
    status: 'high' | 'low' | 'blank' | 'ambiguous' | 'error';
    fill_ratio: number;
    dominance: number;
    selected: string | null;
    pixels: number;
}

interface LowConfidenceItem {
    question_index: number;
    section: 'tf' | 'mc';
    detected: string | null;
    confidence: number;
    dominance?: number;
    fill_ratio?: number;
    pixels?: number;
    reason: 'low' | 'ambiguous' | 'blank' | 'error';
}

interface CorrectAnswers {
    tf: string[];
    mc: string[];
}

interface WebOMRScannerProps {
    onBack: () => void;
    onOpenFeedback?: (evaluationId: string) => void;
}

type Phase = 'setup' | 'camera' | 'preview' | 'processing' | 'result';

interface EvaluationOption {
    id: string;
    title: string;
    grade: string | null;
    subject: string | null;
}

interface PendingScanRequest {
    id: string;
    createdAt: string;
    evaluationId: string;
    imageDataUrl: string;
    totalTF: number;
    totalMC: number;
    correctAnswers: CorrectAnswers;
    studentName: string | null;
    studentId: string | null;
}

interface PendingResultPayload {
    id: string;
    createdAt: string;
    evaluationId: string;
    answers: {
        tf: (string | null)[];
        mc: (string | null)[];
    };
    score: {
        correct: number;
        incorrect: number;
        blank: number;
        total: number;
        percentage: number;
    };
    studentName: string | null;
    studentId: string | null;
}

interface BarcodeDetectorResult {
    rawValue?: string;
}

interface BarcodeDetectorLike {
    detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResult[]>;
}
interface BarcodeDetectorCtorLike {
    new(opts?: { formats?: string[] }): BarcodeDetectorLike;
    getSupportedFormats?: () => Promise<string[]>;
}

// ── E3: Coverage Summary Component (OM-13 + OM-15) ──
const CoverageSummary: React.FC<{ evaluationId: string }> = ({ evaluationId }) => {
    const supabase = createClient();
    const [coverage, setCoverage] = useState<{ total: number; scanned: number; missing: { name: string; rut: string }[]; avgScore: number; passRate: number } | null>(null);

    useEffect(() => {
        if (!evaluationId) return;
        const load = async () => {
            try {
                // Get evaluation grade
                const { data: evalData } = await supabase.from('evaluations').select('grade').eq('id', evaluationId).single();
                if (!evalData?.grade) return;

                // Get enrolled students
                const { data: students } = await supabase.from('students').select('id, first_name, last_name, rut').eq('course_grade', evalData.grade);
                if (!students || students.length === 0) return;

                // Get scanned results
                const { data: results } = await supabase.from('omr_results').select('student_id, score').eq('evaluation_id', evaluationId);
                const scannedIds = new Set((results || []).map((r: { student_id: string | null }) => r.student_id).filter(Boolean));

                const missing = students
                    .filter(s => !scannedIds.has(String(s.id)))
                    .map(s => ({ name: `${s.first_name} ${s.last_name}`, rut: s.rut || '' }));

                const scores = (results || []).map((r: { score: { percentage: number } }) => r.score?.percentage ?? 0);
                const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
                const passRate = scores.length > 0 ? Math.round((scores.filter((s: number) => s >= 60).length / scores.length) * 100) : 0;

                setCoverage({ total: students.length, scanned: scannedIds.size, missing, avgScore, passRate });
            } catch (err) {
                console.error('Error loading coverage:', err);
            }
        };
        load();
    }, [evaluationId]);

    if (!coverage || coverage.total === 0) return null;

    const pct = Math.round((coverage.scanned / coverage.total) * 100);
    const allScanned = coverage.missing.length === 0;

    return (
        <div className={`glass-card-premium p-6 border ${allScanned ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>
            <h3 className="text-lg font-bold text-[var(--on-background)] mb-3 flex items-center gap-2">
                <Users size={18} className={allScanned ? 'text-emerald-400' : 'text-amber-400'} />
                Cobertura de Escaneo
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="text-center p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]">
                    <p className="text-2xl font-bold text-[var(--on-background)]">{coverage.scanned}/{coverage.total}</p>
                    <p className="text-xs text-[var(--muted)]">Escaneados</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]">
                    <p className="text-2xl font-bold text-[var(--on-background)]">{pct}%</p>
                    <p className="text-xs text-[var(--muted)]">Cobertura</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]">
                    <p className="text-2xl font-bold text-[var(--on-background)]">{coverage.avgScore}%</p>
                    <p className="text-xs text-[var(--muted)]">Promedio</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]">
                    <p className="text-2xl font-bold text-[var(--on-background)]">{coverage.passRate}%</p>
                    <p className="text-xs text-[var(--muted)]">Aprobación</p>
                </div>
            </div>

            {!allScanned && (
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                    <p className="text-sm font-bold text-amber-300 mb-2">⚠️ Alumnos sin escanear ({coverage.missing.length})</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                        {coverage.missing.map((m, i) => (
                            <p key={i} className="text-xs text-amber-200/80">• {m.name} {m.rut && `(${m.rut})`}</p>
                        ))}
                    </div>
                </div>
            )}
            {allScanned && (
                <p className="text-sm text-emerald-300 font-medium">✅ Todos los alumnos han sido escaneados.</p>
            )}

            <div className="w-full h-2 bg-[var(--input-bg)] rounded-full overflow-hidden mt-3">
                <div
                    className={`h-full rounded-full transition-all ${allScanned ? 'bg-emerald-500' : 'bg-amber-400'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

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

    // Answer key configuration
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

    // Initialize default correct answers
    useEffect(() => {
        setCorrectAnswers({
            tf: Array(totalTF).fill('V'),
            mc: Array(totalMC).fill('A'),
        });
    }, [totalTF, totalMC]);

    // Auto-load correct answers from evaluation_items when evaluation changes
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
            let query = supabase
                .from('omr_results')
                .select('id')
                .eq('evaluation_id', evaluationId)
                .limit(1);

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
            const { error: updateError } = await supabase
                .from('omr_results')
                .update(payload)
                .eq('id', existingId);
            if (updateError) throw updateError;
            setSavedAsDuplicate(true);
            setSavedResultId(existingId);
            return { id: existingId, wasDuplicate: true };
        }

        const { data: insertedRow, error: insertError } = await supabase
            .from('omr_results')
            .insert(payload)
            .select('id')
            .single();

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

    const fetchWithTimeout = useCallback(async (url: string, options: RequestInit, timeoutMs: number): Promise<Response> => {
        // IOS WEBKIT FETCH BUG FIX:
        // Safari maneja fetch errors lanzando "Load failed" o "The string did not match the expected pattern" 
        // cuando se pasan payloads masivos en options.body (sea JSON o Blob) por límites en su motor interno.
        // Reemplazamos implacablemente fetch por XMLHttpRequest, que no tiene esta restricción letal en iOS.
        return new Promise((resolve, reject) => {
            let xhr: XMLHttpRequest;
            const sanitizedUrl = stripInvisibleChars(url).trim();
            const encodedUrl = encodeURI(sanitizedUrl);
            try {
                xhr = new XMLHttpRequest();
                xhr.open(options.method || 'GET', encodedUrl, true);
                xhr.timeout = timeoutMs;
            } catch (err: unknown) {
                return reject(new Error(`[${OMR_BUILD_TAG}] [XHR Open Error] ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)} · URL=${sanitizedUrl}`));
            }

            if (options.headers) {
                try {
                    const headers = options.headers as Record<string, string>;
                    for (const [key, value] of Object.entries(headers)) {
                        xhr.setRequestHeader(String(key), String(value));
                    }
                } catch (err: unknown) {
                    return reject(new Error(`[${OMR_BUILD_TAG}] [XHR Header Error] ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`));
                }
            }

            xhr.onload = () => {
                const safeStatus = xhr.status >= 200 && xhr.status <= 599 ? xhr.status : 520;
                try {
                    // Avoid parsing response headers manually; Safari/WebKit can throw pattern errors for malformed header lines.
                    const response = new Response(xhr.responseText ?? '', {
                        status: safeStatus,
                        statusText: xhr.statusText || 'OK',
                    });
                    resolve(response);
                } catch (responseErr: unknown) {
                    reject(new Error(`[${OMR_BUILD_TAG}] [XHR Response Error] ${responseErr instanceof Error ? `${responseErr.name}: ${responseErr.message}` : String(responseErr)} · status=${xhr.status}`));
                }
            };

            xhr.onerror = (e) => {
                const urlObj = new URL(sanitizedUrl);
                const isCors = xhr.status === 0;
                let msg = `[${OMR_BUILD_TAG}] [XHR Send] Network request failed. `;
                if (isCors) msg += `Possible CORS/Preflight issue. `;
                msg += `status=${xhr.status}, readyState=${xhr.readyState}, URL=${urlObj.pathname}`;
                reject(new Error(msg));
            };
            xhr.ontimeout = () => reject(new Error(`[${OMR_BUILD_TAG}] [XHR Send] Timeout · URL=${sanitizedUrl}`));

            // XHR native send
            try {
                xhr.send(options.body as XMLHttpRequestBodyInit | null);
            } catch (err: unknown) {
                reject(new Error(`[${OMR_BUILD_TAG}] [XHR Send Error] ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)} · URL=${sanitizedUrl}`));
            }
        });
    }, []);

    // Compresses any data URL to max 1280px / 0.80 quality to keep payloads under nginx proxy limits.
    // Fixes Safari iOS "status=0 / Network request failed" for large file uploads.
    const compressDataUrl = useCallback((dataUrl: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const MAX_DIM = 1280;
                let w = img.naturalWidth || img.width;
                let h = img.naturalHeight || img.height;
                if (w > MAX_DIM || h > MAX_DIM) {
                    const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
                    w = Math.floor(w * ratio);
                    h = Math.floor(h * ratio);
                }
                const c = document.createElement('canvas');
                c.width = w;
                c.height = h;
                c.getContext('2d')!.drawImage(img, 0, 0, w, h);
                resolve(c.toDataURL('image/jpeg', 0.80));
            };
            img.onerror = () => resolve(dataUrl); // fallback: use original if compression fails
            img.src = dataUrl;
        });
    }, []);

    const fetchApi = useCallback(async (path: string, options: RequestInit, timeoutMs = 30000) => {
        const candidates = getApiCandidatesLazy();
        if (candidates.length === 0) {
            throw new Error('No hay endpoint de API valido. Define NEXT_PUBLIC_ASSESSMENT_API_URL en las variables de entorno.');
        }
        const isConnectivityError = (message: string) =>
            /(load failed|failed to fetch|network|network request failed|fetch failed|aborted|timeout|dns|string did not match the expected pattern)/i.test(message);

        // Inyectar token de Supabase en el header Authorization
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
                if (!isConnectivityError(message)) {
                    throw err;
                }
            }
        }

        throw new Error(`OMR_ALL_HOSTS_FAILED: No se pudo conectar al servidor de evaluación. Verifica tu conexión. Detalles: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
    }, [fetchWithTimeout, supabase]);

    const parseJsonResponse = useCallback(async <T,>(response: Response, context: string): Promise<T> => {
        const raw = await response.text();
        return parseJsonText<T>(raw, context);
    }, []);

    const detectQRCodePayload = useCallback(async (blob: Blob): Promise<QRData | null> => {
        const detectorCtor = (window as typeof window & { BarcodeDetector?: BarcodeDetectorCtorLike }).BarcodeDetector;
        if (!detectorCtor) return null;

        // iOS WebKit has partial/buggy BarcodeDetector implementations that can throw DOMException pattern errors.
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

    const dataUrlToBlob = useCallback((dataUrl: string): Blob => {
        const parts = dataUrl.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        return new Blob([uInt8Array], { type: contentType });
    }, []);

    // WebKit workaround no longer needed as we use application/json with Base64.

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
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: new TextEncoder().encode(jsonPayload),
                    }, 30000);

                    if (!response.ok) {
                        throw new Error(`Sync API failed (${response.status})`);
                    }

                    const rawResponse = await response.text();
                    const data: OMRScanResult = parseJsonText<OMRScanResult>(rawResponse, 'sync-success-response');
                    await persistScanResult(data.data, queued.evaluationId, {
                        name: queued.studentName,
                        id: queued.studentId,
                    });

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
                        let query = supabase
                            .from('omr_results')
                            .select('id')
                            .eq('evaluation_id', queuedResult.evaluationId)
                            .limit(1);

                        if (queuedResult.studentId) {
                            query = query.eq('student_id', queuedResult.studentId);
                        } else if (queuedResult.studentName) {
                            query = query.eq('student_name', queuedResult.studentName);
                        }

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
                        const { error: updateError } = await supabase
                            .from('omr_results')
                            .update(payload)
                            .eq('id', existingId);
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
                toast.success('Sincronización OMR completada.');
            }
        } finally {
            setSyncingQueue(false);
        }
    }, [dataUrlToBlob, pendingRequests, pendingResults, persistScanResult, syncingQueue]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncPending();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
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
                if (evalRows.length > 0) {
                    setSelectedEvaluationId(evalRows[0].id);
                }
            } catch (error) {
                console.error('[OMR] Error loading evaluations:', error);
            }
        };

        loadEvaluations();
    }, []);

    // Cleanup stream on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = useCallback(async () => {
        setError(null);

        // Manejo de contextos no seguros o navegadores sin soporte
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError(
                'Tu navegador bloqueó el acceso a la cámara. Esto suele ocurrir si la página no usa HTTPS o necesitas darle permisos manualmente. Por favor, utiliza el botón "Subir Imagen".'
            );
            return;
        }

        try {
            let stream: MediaStream | null = null;

            // Intento 1: constraints ideales con facingMode solicitado
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
                });
            } catch (e1: unknown) {
                // Safari macOS lanza OverconstrainedError para facingMode 'environment'
                // porque no tiene cámara trasera. Reintentamos sin facingMode.
                const fallbackErrors = ['OverconstrainedError', 'ConstraintNotSatisfiedError', 'NotReadableError'];
                const e1Name = e1 instanceof Error ? e1.name : '';
                if (fallbackErrors.includes(e1Name)) {
                    console.warn('[OMR] Camera constraint falló, reintentando sin facingMode:', e1Name);
                    // Intento 2: sin facingMode, con resolución
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({
                            video: { width: { ideal: 1280 }, height: { ideal: 720 } }
                        });
                    } catch {
                        // Intento 3: mínimo absoluto
                        stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    }
                } else {
                    throw e1;
                }
            }

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setPhase('camera');
        } catch (err: unknown) {
            console.error('[OMR] Camera error:', err);
            const errName = err instanceof Error ? err.name : '';
            const errMessage = err instanceof Error ? err.message : 'Desconocido';
            if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
                setError('Permiso denegado para acceder a la cámara. Por favor autoriza el acceso en tu navegador.');
            } else if (errName === 'NotFoundError') {
                setError('No se detectó ninguna cámara en este dispositivo.');
            } else {
                setError(`Error de cámara: ${errMessage}. Verifica los permisos o intenta "Subir Imagen".`);
            }
        }
    }, [facingMode]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    // ── Image quality analysis ──
    const [qualityWarning, setQualityWarning] = useState<string | null>(null);

    const analyzeImageQuality = useCallback((canvas: HTMLCanvasElement): string | null => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Calculate average brightness (simple luminance)
        let totalBrightness = 0;
        const pixelCount = data.length / 4;
        const sampleRate = 10; // Sample every 10th pixel for speed
        let sampled = 0;

        for (let i = 0; i < data.length; i += 4 * sampleRate) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            totalBrightness += (0.299 * r + 0.587 * g + 0.114 * b);
            sampled++;
        }

        const avgBrightness = totalBrightness / sampled;

        if (avgBrightness < 60) {
            return '⚠️ Imagen muy oscura. Encienda la luz de la sala o acérquese a una ventana.';
        }
        if (avgBrightness < 90) {
            return '💡 Iluminación baja. Puede afectar la precisión. Intente mejorar la luz.';
        }

        // Check contrast (std deviation of brightness)
        let sumSqDiff = 0;
        for (let i = 0; i < data.length; i += 4 * sampleRate) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            sumSqDiff += (lum - avgBrightness) ** 2;
        }
        const stdDev = Math.sqrt(sumSqDiff / sampled);

        if (stdDev < 20) {
            return '📸 Imagen borrosa o desenfocada. Asegúrese de que la hoja esté enfocada.';
        }

        return null;
    }, []);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        // DOWN-SCALE OPTIMIZATION FOR iOS WEBKIT
        // iOS Safari/Chrome choke and drop network requests (Network request failed)
        // when uploading large canvas blobs. We resize to max 1280px and use quality 0.80
        // to keep the JSON payload well under the nginx proxy limit (~1MB).
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

        // Apply zoom crop and resize
        if (zoom > 1) {
            const cropW = video.videoWidth / zoom;
            const cropH = video.videoHeight / zoom;
            const cropX = (video.videoWidth - cropW) / 2;
            const cropY = (video.videoHeight - cropH) / 2;
            ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, finalWidth, finalHeight);
        } else {
            ctx.drawImage(video, 0, 0, finalWidth, finalHeight);
        }

        // Analyze quality before proceeding
        const warning = analyzeImageQuality(canvas);
        setQualityWarning(warning);

        canvas.toBlob((blob) => {
            if (blob) {
                setCapturedBlob(blob);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
                console.log(`[OMR] Captura: ${finalWidth}x${finalHeight} · ${(dataUrl.length / 1024).toFixed(0)}KB base64`);
                setCapturedImage(dataUrl);
                stopCamera();

                if (isBatchMode && !warning) {
                    processImage(blob);
                } else {
                    setPhase('preview');
                }
            }
        }, 'image/jpeg', 0.80);
    }, [zoom, stopCamera, analyzeImageQuality, isBatchMode]);

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo de archivo (solo imágenes)
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona una imagen válida (PNG, JPG, etc.)');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Validar tamaño de archivo (ej. max 15MB) para evitar DoS o payloads muy pesados
        if (file.size > 15 * 1024 * 1024) {
            toast.error('El archivo es muy grande. El tamaño máximo permitido es 15MB.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setCapturedBlob(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            setCapturedImage(event.target?.result as string);
            setPhase('preview');
        };
        reader.readAsDataURL(file);
    }, []);

    const retake = useCallback(() => {
        setCapturedImage(null);
        setCapturedBlob(null);
        setResult(null);
        setError(null);
        setSavedResultId(null);
        setSavedAsDuplicate(false);
        setManualAnswers(null);
        setManualScore(null);
        setQrPayload(null);
        setPhase('setup');
    }, []);

    const isProcessingRef = useRef(false);

    const processImage = useCallback(async (autoBlob?: Blob) => {
        const blobToProcess = autoBlob || capturedBlob;
        if (!blobToProcess) return;
        if (isProcessingRef.current) {
            toast.info('Procesamiento en curso, espera a que termine.');
            return;
        }
        // La fricción de pedir el nombre ha sido eliminada. El motor extrae "name_image" y el profesor podrá llenar o editar los nombres más adelante.

        isProcessingRef.current = true;
        let stage = 'init';

        setPhase('processing');
        setError(null);

        try {
            stage = 'connectivity-check';
            if (!navigator.onLine) {
                setError(`Sin conexión a internet. Verifica red móvil/Wi-Fi e intenta nuevamente para procesar con ${formatApiLabel(activeApiBase)}.`);
                setPhase('preview');
                return;
            }

            let effectiveEvaluationId = selectedEvaluationId;
            let effectiveAnswers = correctAnswers;
            let effectiveTF = totalTF;
            let effectiveMC = totalMC;

            stage = 'qr-detection';
            let detectedQR: QRData | null = null;
            try {
                detectedQR = await detectQRCodePayload(blobToProcess);
            } catch (qrError) {
                console.warn('[OMR] QR pre-read skipped due to browser incompatibility:', qrError);
            }
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
                toast.success(`QR detectado: pauta cargada automáticamente (${detectedQR.subject} · ${detectedQR.grade})`);
            }

            if (!effectiveEvaluationId) {
                toast.error('Selecciona una evaluación antes de procesar escaneos.');
                setPhase('preview');
                return;
            }

            stage = 'ping-test';
            try {
                console.log('[OMR] Ejecutando Ping Test a /api/v1/omr/ping-post...');
                const pingRes = await fetchApi('/api/v1/omr/ping-post', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ test: "hello", info: "OMR pre-flight ping" })
                }, 5000); // short timeout for ping

                const pingData = await pingRes.text();
                console.log('[OMR] Ping Test Exitoso. Respuesta:', pingData);
            } catch (pingErr) {
                console.error('[OMR] Ping Test FALLÓ. El servidor bloqueó el POST pequeño:', pingErr);
            }

            stage = 'build-payload';
            let reqOptions: RequestInit;
            let targetEndpoint: string;

            // Detect Safari en iOS interactuando desde Web
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && 'ontouchend' in document);

            if (isIOS && capturedImage) {
                console.log('[OMR] Detectado dispositivo iOS. Usando POST JSON base64.');
                // Compress to ensure payload stays well under the nginx proxy limit.
                // File uploads arrive uncompressed (raw data URI from FileReader), so this is critical.
                stage = 'compress-image';
                const compressedImage = await compressDataUrl(capturedImage);
                console.log(`[OMR] Payload iOS: original=${(capturedImage.length / 1024).toFixed(0)}KB → comprimido=${(compressedImage.length / 1024).toFixed(0)}KB`);
                stage = 'build-payload';
                const jsonPayload = JSON.stringify({
                    image_base64: compressedImage,
                    total_questions: effectiveTF + effectiveMC,
                    question_type: 'mc',
                    correct_answers_json: JSON.stringify(effectiveAnswers)
                });
                targetEndpoint = '/api/v1/omr/process-base64';
                reqOptions = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: jsonPayload
                };
            } else {
                console.log('[OMR] Dispositivo estándar. Usando POST multipart FormData.');
                const formData = new FormData();
                formData.append('file', blobToProcess, 'omr_scan.jpg');
                formData.append('total_questions', String(effectiveTF + effectiveMC));
                formData.append('question_type', 'mc');
                formData.append('correct_answers_json', JSON.stringify(effectiveAnswers));
                targetEndpoint = '/api/v1/omr/process-image';
                reqOptions = {
                    method: 'POST',
                    body: formData
                };
            }

            // OM-14: Retry with exponential backoff for resilience under volume
            const MAX_RETRIES = 3;
            let response: Response | null = null;
            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                try {
                    stage = `api-request-attempt-${attempt + 1}`;
                    response = await fetchApi(targetEndpoint, reqOptions, 30000);
                    if (response.ok) break;
                    // 5xx = retry, 4xx = don't retry
                    if (response.status < 500) break;
                } catch (fetchErr: unknown) {
                    if (attempt === MAX_RETRIES - 1) throw fetchErr;
                }
                // Exponential backoff: 1s, 2s, 4s
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
                toast.info('Resultado leído, pendiente de sincronización con la nube.');
            }

            if (data.data?.answers) {
                const clonedAnswers = {
                    tf: [...(data.data.answers.tf || [])],
                    mc: [...(data.data.answers.mc || [])],
                };
                setManualAnswers(clonedAnswers);
                setManualScore(data.data.score || null);
            }

            if (isBatchMode) {
                // Play a brief success sound if needed, show toast
                toast.success(`Leído: ${data.data?.score.percentage}% (${data.data?.score.correct}/${data.data?.score.total})`);
                setResult(data);
                setPhase('result');
                setTimeout(() => {
                    setCapturedImage(null);
                    setCapturedBlob(null);
                    setResult(null);
                    setError(null);
                    startCamera();
                }, 2000);
            } else {
                setResult(data);
                setPhase('result');
            }
        } catch (err: unknown) {
            const rawMessage = err instanceof Error ? err.message : 'Error al procesar la imagen';
            const errorName = err instanceof Error ? err.name : 'UnknownError';
            const isConnectivityError = /(load failed|failed to fetch|network|network request failed|fetch failed|aborted|timeout|xhr open error|xhr send error|xhr send)/i.test(rawMessage);
            const isParseError = /\[(success-response|error-response)\]|respuesta no es json válido|respuesta vacía/i.test(rawMessage);
            const message = isConnectivityError
                ? `[${OMR_BUILD_TAG}][${stage}] No se pudo conectar con ${formatApiLabel(activeApiBase)}. (${errorName}: ${rawMessage})`
                : isParseError
                    ? `[${OMR_BUILD_TAG}][${stage}] El backend respondió en un formato inválido. (${errorName}: ${rawMessage})`
                    : `[${OMR_BUILD_TAG}][${stage}] ${errorName}: ${rawMessage}`;

            console.error('[OMR] Error:', message);
            const userFriendlyMessage = "No se pudo procesar la hoja. Verifica tu conexión a internet e inténtalo nuevamente.";
            setError(userFriendlyMessage);
            setPhase('preview');
            if (isBatchMode) {
                toast.error(userFriendlyMessage);
            }
        } finally {
            isProcessingRef.current = false;
        }
    }, [capturedBlob, capturedImage, correctAnswers, totalTF, totalMC, isBatchMode, startCamera, selectedEvaluationId, persistScanResult, queueResultForSync, fetchApi, activeApiBase, detectQRCodePayload, parseJsonResponse, compressDataUrl]);

    const flipCamera = useCallback(() => {
        stopCamera();
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
        // Camera will restart after state change
    }, [stopCamera]);

    const recalculateScore = useCallback((answersToScore: { tf: (string | null)[]; mc: (string | null)[] }) => {
        const tfDetected = answersToScore.tf || [];
        const mcDetected = answersToScore.mc || [];

        let correct = 0;
        let incorrect = 0;
        let blank = 0;

        for (let i = 0; i < correctAnswers.tf.length; i++) {
            const detected = tfDetected[i] ?? null;
            if (!detected) {
                blank += 1;
            } else if (detected === correctAnswers.tf[i]) {
                correct += 1;
            } else {
                incorrect += 1;
            }
        }

        for (let i = 0; i < correctAnswers.mc.length; i++) {
            const detected = mcDetected[i] ?? null;
            if (!detected) {
                blank += 1;
            } else if (detected === correctAnswers.mc[i]) {
                correct += 1;
            } else {
                incorrect += 1;
            }
        }

        const total = correctAnswers.tf.length + correctAnswers.mc.length;
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

        return { correct, incorrect, blank, total, percentage };
    }, [correctAnswers]);

    const persistManualOverride = useCallback(async (
        nextAnswers: { tf: (string | null)[]; mc: (string | null)[] },
        nextScore: { correct: number; incorrect: number; blank: number; total: number; percentage: number }
    ) => {
        if (!savedResultId) return;
        const { error: updateError } = await supabase
            .from('omr_results')
            .update({
                answers: nextAnswers,
                score: {
                    ...nextScore,
                    manual_override: true,
                    manual_override_at: new Date().toISOString(),
                },
                updated_at: new Date().toISOString(),
            })
            .eq('id', savedResultId);

        if (updateError) {
            console.error('[OMR] Error saving manual override:', updateError);
            toast.error('No se pudo guardar la corrección manual.');
        }
    }, [savedResultId]);

    const applyManualOverride = useCallback(async (
        section: 'tf' | 'mc',
        questionIndex: number,
        value: string | null
    ) => {
        if (!manualAnswers) return;
        const nextAnswers = {
            tf: [...manualAnswers.tf],
            mc: [...manualAnswers.mc],
        };
        const target = nextAnswers[section];
        const idx = questionIndex - 1;
        if (idx < 0 || idx >= target.length) return;
        target[idx] = value;

        const nextScore = recalculateScore(nextAnswers);
        setManualAnswers(nextAnswers);
        setManualScore(nextScore);
        await persistManualOverride(nextAnswers, nextScore);
    }, [manualAnswers, persistManualOverride, recalculateScore]);

    // Restart camera when facing mode changes (only if in camera phase)
    useEffect(() => {
        if (phase === 'camera') {
            startCamera();
        }
    }, [facingMode]);

    // ─── Render Helpers ─────────────────────

    const renderSetup = () => (
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
                            <h2 className="text-2xl font-bold text-[var(--on-background)]">Escáner OMR Web</h2>
                            <p className="text-sm text-[var(--muted)]">Escanea hojas de respuestas con la cámara</p>
                        </div>
                    </div>

                    <div className="space-y-4 text-[var(--muted)]">
                        <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 mt-0.5 w-6 h-6 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] text-xs font-bold">1</span>
                            <p className="text-base">Configura la <strong className="text-[var(--on-background)]">pauta de corrección</strong> con las respuestas correctas.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 mt-0.5 w-6 h-6 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] text-xs font-bold">2</span>
                            <p className="text-base">Toma una <strong className="text-[var(--on-background)]">foto de la hoja de respuestas</strong> o sube una imagen.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 mt-0.5 w-6 h-6 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] text-xs font-bold">3</span>
                            <p className="text-base">El sistema <strong className="text-[var(--on-background)]">detecta las marcas automáticamente</strong> y calcula el puntaje.</p>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-3">
                        <AlertTriangle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-amber-300/80">
                            Usa la hoja de respuestas estándar de EducMark. Buena iluminación y enfoque mejoran la precisión.
                        </p>
                    </div>
                </div>
            </div>

            <div className="glass-card-premium p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-base font-semibold text-[var(--on-background)]">Escáner OMR</h3>
                        <p className="text-sm text-[var(--muted)]">
                            {isOnline ? 'Conectado al servidor de corrección' : 'Sin conexión — los escaneos se guardarán localmente'}
                            {(pendingRequests.length + pendingResults.length) > 0 && ` · ${pendingRequests.length + pendingResults.length} pendiente(s)`}
                        </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isOnline ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'}`}>
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>

                <div>
                    <label className="text-sm text-[var(--muted)] font-medium block mb-2">Evaluación destino</label>
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
                        <p className="text-xs text-amber-300 mt-2">Debes seleccionar una evaluación para poder guardar y sincronizar escaneos.</p>
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
                            placeholder="RUT o código interno"
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
                        <span className="text-lg font-semibold text-[var(--on-background)]">Pauta de Corrección</span>
                    </div>
                    <span className="text-sm text-[var(--muted)]">{showAnswerConfig ? 'Ocultar ▲' : 'Configurar ▼'}</span>
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
                                {/* Question counts */}
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

                                {/* TF Answers */}
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

                                {/* MC Answers */}
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
                    Abrir Cámara
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
                        <h4 className="text-[var(--on-background)] font-bold">Modo Ráfaga (Batch)</h4>
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

    const renderCamera = () => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full max-w-3xl mx-auto"
        >
            {/* Video Feed */}
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto"
                    style={{ transform: zoom > 1 ? `scale(${zoom})` : undefined }}
                />

                {/* Guide Overlay — Document frame with anchor markers */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Darkened outside area */}
                    <div className="absolute inset-0 bg-black/30"></div>
                    {/* Clear center area */}
                    <div className="absolute top-[8%] left-[6%] right-[6%] bottom-[8%] bg-transparent border-2 border-dashed border-white/50 rounded-lg"
                        style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)' }}
                    >
                        {/* Anchor markers — match the 4 fiducial squares on the sheet */}
                        {/* Top-Left */}
                        <div className="absolute -top-1 -left-1">
                            <div className="w-8 h-8 border-2 border-cyan-400 bg-cyan-400/10 flex items-center justify-center">
                                <div className="w-4 h-4 bg-cyan-400/30"></div>
                            </div>
                        </div>
                        {/* Top-Right */}
                        <div className="absolute -top-1 -right-1">
                            <div className="w-8 h-8 border-2 border-cyan-400 bg-cyan-400/10 flex items-center justify-center">
                                <div className="w-4 h-4 bg-cyan-400/30"></div>
                            </div>
                        </div>
                        {/* Bottom-Left */}
                        <div className="absolute -bottom-1 -left-1">
                            <div className="w-8 h-8 border-2 border-cyan-400 bg-cyan-400/10 flex items-center justify-center">
                                <div className="w-4 h-4 bg-cyan-400/30"></div>
                            </div>
                        </div>
                        {/* Bottom-Right */}
                        <div className="absolute -bottom-1 -right-1">
                            <div className="w-8 h-8 border-2 border-cyan-400 bg-cyan-400/10 flex items-center justify-center">
                                <div className="w-4 h-4 bg-cyan-400/30"></div>
                            </div>
                        </div>

                        {/* Corner connecting lines */}
                        <div className="absolute top-0 left-8 right-8 h-0.5 bg-cyan-400/20"></div>
                        <div className="absolute bottom-0 left-8 right-8 h-0.5 bg-cyan-400/20"></div>
                        <div className="absolute left-0 top-8 bottom-8 w-0.5 bg-cyan-400/20"></div>
                        <div className="absolute right-0 top-8 bottom-8 w-0.5 bg-cyan-400/20"></div>

                        {/* Scan line animation */}
                        <motion.div
                            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </div>

                    {/* Hint text — Anchor alignment */}
                    <div className="absolute top-[13%] left-0 right-0 text-center pointer-events-none z-10">
                        <span className="px-4 py-2 bg-black/70 text-white rounded-full text-sm backdrop-blur-sm font-medium inline-block max-w-[90%] shadow-lg">
                            Alinee los 4 cuadrados negros ▪️ con las esquinas
                        </span>
                    </div>
                </div>
            </div>

            {/* Camera Controls */}
            <div className="flex items-center justify-center gap-4 mt-6">
                <button
                    onClick={() => setZoom(z => Math.max(1, z - 0.5))}
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

                {/* Main capture button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white border-4 border-cyan-400 shadow-lg shadow-cyan-400/30 flex items-center justify-center hover:bg-cyan-50 transition-colors"
                >
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300"></div>
                </motion.button>

                <button
                    onClick={() => setZoom(z => Math.min(3, z + 0.5))}
                    className="p-3 rounded-full bg-[var(--input-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--on-background)] transition-colors"
                    disabled={zoom >= 3}
                >
                    <ZoomIn size={20} />
                </button>

                <button
                    onClick={() => { stopCamera(); retake(); }}
                    className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                >
                    <CameraOff size={20} />
                </button>
            </div>
        </motion.div>
    );

    const renderPreview = () => (
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

            {/* Quality Warning */}
            {qualityWarning && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-amber-300 font-medium">{qualityWarning}</p>
                        <p className="text-xs text-amber-300/60 mt-1">Puede continuar, pero la precisión podría verse afectada.</p>
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
                    onClick={() => processImage()}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-shadow"
                >
                    <Send size={18} />
                    Procesar
                </motion.button>
            </div>
        </motion.div>
    );

    // Processing step messages
    const processingSteps = [
        { icon: '📐', text: 'Detectando marcadores de esquina...' },
        { icon: '🔄', text: 'Corrigiendo perspectiva y rotación...' },
        { icon: '🔍', text: 'Analizando burbujas marcadas...' },
        { icon: '🧮', text: 'Calculando puntaje...' },
        { icon: '✅', text: 'Verificando confianza de detección...' },
    ];

    const [processingStep, setProcessingStep] = useState(0);

    useEffect(() => {
        if (phase !== 'processing') {
            setProcessingStep(0);
            return;
        }
        const interval = setInterval(() => {
            setProcessingStep(prev => (prev + 1) % processingSteps.length);
        }, 1800);
        return () => clearInterval(interval);
    }, [phase]);

    const renderProcessing = () => (
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

            <h3 className="text-3xl font-bold text-[var(--on-background)] mb-3 relative z-10">Procesando hoja de respuestas…</h3>

            {/* Animated step indicator */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={processingStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-center gap-2 mb-8 relative z-10"
                >
                    <span className="text-2xl">{processingSteps[processingStep].icon}</span>
                    <span className="text-[var(--muted)] text-lg font-medium">
                        {processingSteps[processingStep].text}
                    </span>
                </motion.div>
            </AnimatePresence>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-2 mb-8 relative z-10">
                {processingSteps.map((_, i) => (
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

            {/* Progress bar */}
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
                    Motor OMR v2.1 · Visión Artificial
                </p>
            </div>
        </motion.div>
    );

    const renderResult = () => {
        if (!result?.data) return null;
        const { score, answers, name_image } = result.data;
        const lowConfidenceItems = result.data.low_confidence_items || [];
        const displayedAnswers = manualAnswers || answers;
        const displayedScore = manualScore || score;
        const passed = displayedScore.percentage >= 60;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto space-y-8"
            >
                {/* Score Hero */}
                <div className={`glass-card-premium p-8 relative overflow-hidden text-center ${passed ? 'border-emerald-500/20' : 'border-rose-500/20'
                    }`} style={{ borderWidth: '1px', borderStyle: 'solid' }}>
                    <div className={`absolute inset-0 ${passed ? 'bg-emerald-500/3' : 'bg-rose-500/3'}`}></div>
                    <div className="relative z-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                            className="inline-block mb-4"
                        >
                            {passed
                                ? <CheckCircle2 size={56} className="text-emerald-400" />
                                : <XCircle size={56} className="text-rose-400" />
                            }
                        </motion.div>

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className={`text-6xl font-black mb-2 ${passed ? 'text-emerald-400' : 'text-rose-400'}`}
                        >
                            {displayedScore.percentage}%
                        </motion.h2>
                        <p className="text-[var(--muted)] text-lg">
                            {displayedScore.correct} correctas de {displayedScore.total} preguntas
                        </p>
                        {(savedAsDuplicate || savedResultId) && (
                            <div className="mt-3 text-xs">
                                {savedAsDuplicate ? (
                                    <span className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300">
                                        Resultado actualizado (rescaneo sobreescribió intento previo)
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                                        Resultado guardado en la nube
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Name snippet */}
                        {name_image && (
                            <div className="mt-4 inline-block">
                                <p className="text-xs text-[var(--muted)] mb-1">Nombre detectado</p>
                                <img
                                    src={`data:image/jpeg;base64,${name_image}`}
                                    alt="Nombre del alumno"
                                    className="max-h-10 rounded border border-[var(--border)] bg-white"
                                />
                            </div>
                        )}
                        {qrPayload && (
                            <div className="mt-3 p-2.5 rounded-lg border border-cyan-500/25 bg-cyan-500/10 inline-block">
                                <p className="text-xs text-cyan-200/85">
                                    QR detectado: {qrPayload.subject} · {qrPayload.grade} · eval {qrPayload.id}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="glass-card-premium p-6 text-center">
                        <p className="text-3xl font-bold text-emerald-400">{displayedScore.correct}</p>
                        <p className="text-sm text-[var(--muted)] mt-1">Correctas</p>
                    </div>
                    <div className="glass-card-premium p-6 text-center">
                        <p className="text-3xl font-bold text-rose-400">{displayedScore.incorrect}</p>
                        <p className="text-sm text-[var(--muted)] mt-1">Incorrectas</p>
                    </div>
                    <div className="glass-card-premium p-6 text-center">
                        <p className="text-3xl font-bold text-amber-400">{displayedScore.blank}</p>
                        <p className="text-sm text-[var(--muted)] mt-1">En Blanco</p>
                    </div>
                </div>

                {/* Manual review panel */}
                {lowConfidenceItems.length > 0 && (
                    <div className="glass-card-premium p-6 border border-amber-500/25">
                        <h3 className="text-lg font-bold text-amber-300 mb-2 flex items-center gap-2">
                            <AlertTriangle size={18} />
                            Marcas Dudosas ({lowConfidenceItems.length})
                        </h3>
                        <p className="text-sm text-[var(--muted)] mb-4">
                            Revisa y corrige estas preguntas. Cada cambio actualiza el puntaje y se guarda en el resultado.
                        </p>
                        <div className="space-y-3">
                            {lowConfidenceItems.map((item) => {
                                const answerList = item.section === 'tf' ? displayedAnswers.tf : displayedAnswers.mc;
                                const currentValue = answerList[item.question_index - 1] ?? '';
                                const options = item.section === 'tf' ? ['V', 'F'] : ['A', 'B', 'C', 'D', 'E'];
                                return (
                                    <div key={`${item.section}-${item.question_index}`} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)]">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--on-background)]">
                                                    {item.section.toUpperCase()} #{item.question_index}
                                                </p>
                                                <p className="text-xs text-[var(--muted)]">
                                                    Detectada: {item.detected ?? 'En blanco'} · Confianza: {Math.round((item.confidence || 0) * 100)}% · Dominancia: {item.dominance ?? 0} · Fill: {Math.round((item.fill_ratio || 0) * 100)}%
                                                </p>
                                            </div>
                                            <select
                                                value={currentValue}
                                                onChange={(e) => applyManualOverride(item.section, item.question_index, e.target.value || null)}
                                                className="px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm"
                                            >
                                                <option value="">En blanco</option>
                                                {options.map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Detected Answers */}
                <div className="glass-card-premium p-8">
                    <h3 className="text-xl font-bold text-[var(--on-background)] mb-6 flex items-center gap-2">
                        <Eye size={20} className="text-cyan-400" />
                        Respuestas Detectadas
                    </h3>

                    {/* TF Section */}
                    {answers.tf.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-[var(--muted)] mb-3 uppercase tracking-wider">
                                Verdadero / Falso
                            </h4>
                            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                {displayedAnswers.tf.map((ans, i) => {
                                    const isCorrect = correctAnswers.tf[i] === ans;
                                    const isBlank = ans === null;
                                    return (
                                        <div
                                            key={`result-tf-${i}`}
                                            className={`p-2 text-center rounded-lg border text-sm font-bold ${isBlank
                                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                : isCorrect
                                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                                                }`}
                                        >
                                            <span className="text-[10px] text-[var(--muted)] block">{i + 1}</span>
                                            {isBlank ? '—' : ans}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* MC Section */}
                    {answers.mc.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--muted)] mb-3 uppercase tracking-wider">
                                Selección Múltiple
                            </h4>
                            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                {displayedAnswers.mc.map((ans, i) => {
                                    const isCorrect = correctAnswers.mc[i] === ans;
                                    const isBlank = ans === null;
                                    return (
                                        <div
                                            key={`result-mc-${i}`}
                                            className={`p-2 text-center rounded-lg border text-sm font-bold ${isBlank
                                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                : isCorrect
                                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                                                }`}
                                        >
                                            <span className="text-[10px] text-[var(--muted)] block">{i + 1}</span>
                                            {isBlank ? '—' : ans}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={retake}
                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--on-background)] font-semibold hover:border-[var(--primary)] transition-colors"
                    >
                        <RotateCcw size={18} />
                        Escanear Otro
                    </button>
                    <button
                        onClick={onBack}
                        className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] text-[var(--on-background)] font-semibold hover:border-[var(--primary)] transition-colors"
                    >
                        <CheckCircle2 size={18} />
                        Finalizar
                    </button>
                </div>
                {onOpenFeedback && savedResultId && (
                    <button
                        onClick={() => onOpenFeedback(selectedEvaluationId)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg hover:opacity-90 transition-opacity"
                    >
                        <BrainCircuit size={18} />
                        Ver Retroalimentación Docente
                    </button>
                )}

                {/* ── E3: Coverage Summary — Missing students alert (OM-13) + Batch Summary (OM-15) ── */}
                <CoverageSummary evaluationId={selectedEvaluationId} />
            </motion.div>
        );
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { stopCamera(); onBack(); }}
                        className="p-2 rounded-lg hover:bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--on-background)] transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--on-background)]">Escáner OMR</h1>
                        <p className="text-sm text-[var(--muted)]">
                            {phase === 'setup' && 'Configura y captura'}
                            {phase === 'camera' && 'Posiciona la hoja y captura'}
                            {phase === 'preview' && 'Revisa la captura'}
                            {phase === 'processing' && 'Analizando…'}
                            {phase === 'result' && 'Resultados del escaneo'}
                        </p>
                    </div>
                </div>

                {/* Phase indicator */}
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

            {/* Canvas for capture (hidden) */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Phase Content */}
            <AnimatePresence mode="wait">
                {phase === 'setup' && renderSetup()}
                {phase === 'camera' && renderCamera()}
                {phase === 'preview' && renderPreview()}
                {phase === 'processing' && renderProcessing()}
                {phase === 'result' && renderResult()}
            </AnimatePresence>
        </div>
    );
};
