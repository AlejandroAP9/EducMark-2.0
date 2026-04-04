export interface OMRScanResult {
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

export interface ConfidenceEntry {
    confidence: number;
    status: 'high' | 'low' | 'blank' | 'ambiguous' | 'error';
    fill_ratio: number;
    dominance: number;
    selected: string | null;
    pixels: number;
}

export interface LowConfidenceItem {
    question_index: number;
    section: 'tf' | 'mc';
    detected: string | null;
    confidence: number;
    dominance?: number;
    fill_ratio?: number;
    pixels?: number;
    reason: 'low' | 'ambiguous' | 'blank' | 'error';
}

export interface CorrectAnswers {
    tf: string[];
    mc: string[];
}

export interface WebOMRScannerProps {
    onBack: () => void;
    onOpenFeedback?: (evaluationId: string) => void;
}

export type Phase = 'setup' | 'camera' | 'preview' | 'processing' | 'result';

export interface EvaluationOption {
    id: string;
    title: string;
    grade: string | null;
    subject: string | null;
}

export interface PendingScanRequest {
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

export interface PendingResultPayload {
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

export interface BarcodeDetectorResult {
    rawValue?: string;
}

export interface BarcodeDetectorLike {
    detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResult[]>;
}

export interface BarcodeDetectorCtorLike {
    new(opts?: { formats?: string[] }): BarcodeDetectorLike;
    getSupportedFormats?: () => Promise<string[]>;
}
