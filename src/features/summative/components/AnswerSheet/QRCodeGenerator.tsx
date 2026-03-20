'use client';

import React, { useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import CryptoJS from 'crypto-js';
import * as QRCode from 'qrcode';

export interface QRData {
    v: number;                    // Version
    id: string;                   // Assessment ID
    subject: string;              // Subject
    grade: string;                // Grade
    unit: string;                 // Unit
    oa: string;                   // Learning Objective
    date: string;                 // Creation date
    student_id?: string;          // Optional Student ID for batch generation
    answers: {
        tf: string[];               // True/False answers: ["V","F","V"...]
        mc: string[];               // Multiple choice: ["A","C","B"...]
    };
}

interface QRCodeGeneratorProps {
    data: QRData;
    size?: number;
    encryptionKey?: string;
}

const DEFAULT_KEY = 'educmark-omr-2026';

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
    data,
    size = 200,
    encryptionKey = DEFAULT_KEY,
}) => {
    const qrValue = useMemo(() => {
        const jsonData = JSON.stringify(data);
        const encrypted = CryptoJS.AES.encrypt(jsonData, encryptionKey).toString();
        return encrypted;
    }, [data, encryptionKey]);

    return (
        <QRCodeCanvas
            value={qrValue}
            size={size}
            level="M"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#000000"
        />
    );
};

// Utility function to decrypt QR data (for the mobile app)
export const decryptQRData = (encryptedData: string, key: string = DEFAULT_KEY): QRData | null => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, key);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedString);
    } catch (error) {
        console.error('Failed to decrypt QR data:', error);
        return null;
    }
};

// Utility to generate QR as data URL (async — uses ESM import)
export const generateQRDataURL = async (
    data: QRData,
    size: number = 200,
    encryptionKey: string = DEFAULT_KEY
): Promise<string> => {
    const jsonData = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonData, encryptionKey).toString();

    return QRCode.toDataURL(encrypted, {
        width: size,
        margin: 0,
        errorCorrectionLevel: 'M',
    });
};

export default QRCodeGenerator;
