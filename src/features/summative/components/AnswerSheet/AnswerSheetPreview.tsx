'use client';

import React, { useEffect, useRef, useState } from 'react';
import { generateBatchAnswerSheetHTML, AnswerSheetData } from './answerSheetTemplate';
import { QRData } from './QRCodeGenerator';
import CryptoJS from 'crypto-js';
import * as QRCode from 'qrcode';

interface AnswerSheetPreviewProps {
    evaluationInfo: {
        id: string;
        subject: string;
        grade: string;
        unit: string;
        oa: string;
    };
    answers?: {
        tf: string[];
        mc: string[];
    };
    logo?: string | null;
    trueFalseCount: number;
    multipleChoiceCount: number;
    idealScore?: number;
    encryptionKey?: string;
    students?: {
        id: string;
        first_name: string;
        last_name: string;
        rut: string;
    }[];
    mcOptions?: 4 | 5;
}

const DEFAULT_KEY = 'educmark-omr-2026';

export const AnswerSheetPreview: React.FC<AnswerSheetPreviewProps> = ({
    evaluationInfo,
    answers = { tf: [], mc: [] },
    logo,
    trueFalseCount,
    multipleChoiceCount,
    idealScore,
    encryptionKey = DEFAULT_KEY,
    students = [],
    mcOptions = 5,
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [iframeHtml, setIframeHtml] = useState<string>('');
    const [debugError, setDebugError] = useState<string>('');

    useEffect(() => {
        const generatePreview = async () => {
            setIsGenerating(true);
            setDebugError('');

            try {
                const pages: AnswerSheetData[] = [];
                const studentList = students && students.length > 0 ? students : [{ id: 'generic', first_name: '', last_name: '', rut: '' }];

                for (const student of studentList) {
                    const qrData: QRData = {
                        v: 1,
                        id: evaluationInfo.id,
                        subject: evaluationInfo.subject,
                        grade: evaluationInfo.grade,
                        unit: evaluationInfo.unit,
                        oa: evaluationInfo.oa,
                        date: new Date().toISOString().split('T')[0],
                        student_id: student.id !== 'generic' ? student.id : undefined,
                        answers: answers,
                    };

                    const encryptedData = CryptoJS.AES.encrypt(
                        JSON.stringify(qrData),
                        encryptionKey
                    ).toString();

                    const qrDataUrl = await QRCode.toDataURL(encryptedData, {
                        width: 200,
                        margin: 0,
                        errorCorrectionLevel: 'M',
                    });

                    pages.push({
                        institutionLogo: logo || undefined,
                        qrCodeDataUrl: qrDataUrl,
                        evaluationInfo: {
                            id: evaluationInfo.id,
                            subject: evaluationInfo.subject,
                            grade: evaluationInfo.grade,
                            unit: evaluationInfo.unit,
                            oa: evaluationInfo.oa,
                        },
                        totalQuestions: {
                            trueFalse: trueFalseCount,
                            multipleChoice: multipleChoiceCount,
                        },
                        idealScore: idealScore,
                        studentName: student.id !== 'generic' ? `${student.first_name} ${student.last_name}` : undefined,
                        studentRut: student.id !== 'generic' ? student.rut : undefined,
                        mcOptions,
                    });
                }

                const html = generateBatchAnswerSheetHTML(pages);

                if (!html) {
                    setDebugError('Error: HTML generado está vacío.');
                    return;
                }

                setIframeHtml(html);

            } catch (error: unknown) {
                console.error('Error generating preview:', error);
                setDebugError(`Falló generación: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                setIsGenerating(false);
            }
        };

        generatePreview();

        // No cleanup needed when using iframe `srcDoc`.
    }, [evaluationInfo, answers, logo, trueFalseCount, multipleChoiceCount, idealScore, encryptionKey, mcOptions]);

    return (
        <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden flex flex-col">
            {debugError && (
                <div className="absolute top-0 left-0 w-full z-20 bg-red-500 text-white p-4 text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap">
                    {debugError}
                </div>
            )}
            {isGenerating && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span>Generando preview...</span>
                    </div>
                </div>
            )}
            <iframe
                ref={iframeRef}
                title="Answer Sheet Preview"
                srcDoc={iframeHtml}
                onLoad={() => {
                    try {
                        iframeRef.current?.contentWindow?.scrollTo(0, 0);
                    } catch {
                        // Ignore cross-context scroll errors.
                    }
                }}
                className="w-full h-full border-0"
                style={{ minHeight: '600px', backgroundColor: '#e5e7eb' }}
            />
        </div>
    );
};

// Export function to generate downloadable HTML
export const generateDownloadableHTML = async (
    evaluationInfo: {
        id: string;
        subject: string;
        grade: string;
        unit: string;
        oa: string;
    },
    answers: { tf: string[]; mc: string[] },
    logo: string | null,
    trueFalseCount: number,
    multipleChoiceCount: number,
    idealScore?: number,
    encryptionKey: string = DEFAULT_KEY,
    students: { id: string; first_name: string; last_name: string; rut: string }[] = [],
    mcOptions: 4 | 5 = 5
): Promise<string> => {
    const pages: AnswerSheetData[] = [];
    const studentList = students && students.length > 0 ? students : [{ id: 'generic', first_name: '', last_name: '', rut: '' }];

    for (const student of studentList) {
        const qrData: QRData = {
            v: 1,
            id: evaluationInfo.id,
            subject: evaluationInfo.subject,
            grade: evaluationInfo.grade,
            unit: evaluationInfo.unit,
            oa: evaluationInfo.oa,
            date: new Date().toISOString().split('T')[0],
            student_id: student.id !== 'generic' ? student.id : undefined,
            answers: answers,
        };

        const encryptedData = CryptoJS.AES.encrypt(
            JSON.stringify(qrData),
            encryptionKey
        ).toString();

        const qrDataUrl = await QRCode.toDataURL(encryptedData, {
            width: 200,
            margin: 0,
            errorCorrectionLevel: 'M',
        });

        pages.push({
            institutionLogo: logo || undefined,
            qrCodeDataUrl: qrDataUrl,
            evaluationInfo: {
                id: evaluationInfo.id,
                subject: evaluationInfo.subject,
                grade: evaluationInfo.grade,
                unit: evaluationInfo.unit,
                oa: evaluationInfo.oa,
            },
            totalQuestions: {
                trueFalse: trueFalseCount,
                multipleChoice: multipleChoiceCount,
            },
            idealScore: idealScore,
            studentName: student.id !== 'generic' ? `${student.first_name} ${student.last_name}` : undefined,
            studentRut: student.id !== 'generic' ? student.rut : undefined,
            mcOptions,
        });
    }

    return generateBatchAnswerSheetHTML(pages);
};

export default AnswerSheetPreview;
