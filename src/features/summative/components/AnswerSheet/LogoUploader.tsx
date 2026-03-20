'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface LogoUploaderProps {
    onLogoChange: (logoDataUrl: string | null) => void;
    currentLogo?: string | null;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
    onLogoChange,
    currentLogo,
}) => {
    const [preview, setPreview] = useState<string | null>(currentLogo || null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona una imagen válida (PNG, JPG, etc.)');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('El archivo es muy grande. Máximo 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setPreview(dataUrl);
            onLogoChange(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleRemove = () => {
        setPreview(null);
        onLogoChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo Institucional (opcional)
            </label>

            {preview ? (
                <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                    <img
                        src={preview}
                        alt="Logo preview"
                        className="w-full h-full object-contain p-2"
                    />
                    <button
                        onClick={handleRemove}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        title="Eliminar logo"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
            w-32 h-32 border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center cursor-pointer
            transition-colors
            ${isDragging
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                        }
          `}
                >
                    <ImageIcon size={24} className="text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500 text-center px-2">
                        Arrastra o haz clic
                    </span>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
            />

            <p className="text-xs text-gray-400 mt-2">
                PNG, JPG hasta 2MB
            </p>
        </div>
    );
};

export default LogoUploader;
