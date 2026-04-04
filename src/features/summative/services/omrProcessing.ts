import type { CorrectAnswers } from '../types/omrScanner';

// ── Constants ──

export const OMR_PENDING_REQUESTS_KEY = 'educmark_omr_pending_requests_v1';
export const OMR_PENDING_RESULTS_KEY = 'educmark_omr_pending_results_v1';
export const OMR_BUILD_TAG = 'OMR-BUILD-20260307C';
export const DEFAULT_API_BASE = '';

// ── URL Sanitization Helpers ──

export const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const trimQuotes = (value: string) => value.replace(/^['"]+|['"]+$/g, '');

export const stripInvisibleChars = (value: string) =>
    value
        .normalize('NFKC')
        .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '');

export const isValidHttpBaseUrl = (value: string) => {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

export const toAbsoluteBase = (value: string) => {
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

export const getApiCandidates = () => {
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
export const getApiCandidatesLazy = () => {
    if (_apiCandidatesCache === null) _apiCandidatesCache = getApiCandidates();
    return _apiCandidatesCache;
};

export const formatApiLabel = (base: string) => {
    if (!base) return 'API';
    try {
        return new URL(base).host;
    } catch {
        return base;
    }
};

export const joinBaseAndPath = (base: string, path: string) => {
    const normalizedBase = trimTrailingSlash(stripInvisibleChars(base).trim());
    const normalizedPath = stripInvisibleChars(path).startsWith('/') ? stripInvisibleChars(path) : `/${stripInvisibleChars(path)}`;
    return `${normalizedBase}${normalizedPath}`;
};

// ── JSON Parsing ──

export const parseJsonText = <T,>(raw: string, context: string): T => {
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

// ── Image Processing (DOM-dependent, but no React) ──

/**
 * Compresses any data URL to max 1280px / 0.80 quality to keep payloads under nginx proxy limits.
 * Fixes Safari iOS "status=0 / Network request failed" for large file uploads.
 */
export const compressDataUrl = (dataUrl: string): Promise<string> => {
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
};

export const dataUrlToBlob = (dataUrl: string): Blob => {
    const parts = dataUrl.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
};

// ── Image Quality Analysis ──

export const analyzeImageQuality = (canvas: HTMLCanvasElement): string | null => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Calculate average brightness (simple luminance)
    let totalBrightness = 0;
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
};

// ── Score Calculation ──

export const recalculateScore = (
    answersToScore: { tf: (string | null)[]; mc: (string | null)[] },
    correctAnswers: CorrectAnswers
) => {
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
};

// ── Network: XHR-based fetch (iOS WebKit compatibility) ──

/**
 * IOS WEBKIT FETCH BUG FIX:
 * Safari maneja fetch errors lanzando "Load failed" o "The string did not match the expected pattern"
 * cuando se pasan payloads masivos en options.body (sea JSON o Blob) por limites en su motor interno.
 * Reemplazamos implacablemente fetch por XMLHttpRequest, que no tiene esta restriccion letal en iOS.
 */
export const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number): Promise<Response> => {
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

        xhr.onerror = () => {
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
};

// ── Processing Step Messages ──

export const PROCESSING_STEPS = [
    { icon: '📐', text: 'Detectando marcadores de esquina...' },
    { icon: '🔄', text: 'Corrigiendo perspectiva y rotación...' },
    { icon: '🔍', text: 'Analizando burbujas marcadas...' },
    { icon: '🧮', text: 'Calculando puntaje...' },
    { icon: '✅', text: 'Verificando confianza de detección...' },
];

// ── Connectivity Error Detection ──

export const isConnectivityError = (message: string) =>
    /(load failed|failed to fetch|network|network request failed|fetch failed|aborted|timeout|dns|string did not match the expected pattern)/i.test(message);

export const isParseError = (message: string) =>
    /\[(success-response|error-response)\]|respuesta no es json válido|respuesta vacía/i.test(message);

export const buildErrorMessage = (stage: string, rawMessage: string, errorName: string, apiBase: string) => {
    if (isConnectivityError(rawMessage)) {
        return `[${OMR_BUILD_TAG}][${stage}] No se pudo conectar con ${formatApiLabel(apiBase)}. (${errorName}: ${rawMessage})`;
    }
    if (isParseError(rawMessage)) {
        return `[${OMR_BUILD_TAG}][${stage}] El backend respondió en un formato inválido. (${errorName}: ${rawMessage})`;
    }
    return `[${OMR_BUILD_TAG}][${stage}] ${errorName}: ${rawMessage}`;
};
