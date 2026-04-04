'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CameraOff, ZoomIn, ZoomOut, FlipHorizontal } from 'lucide-react';

export interface CameraPhaseProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    flipCamera: () => void;
    capturePhoto: () => void;
    stopCamera: () => void;
    retake: () => void;
}

export const CameraPhase: React.FC<CameraPhaseProps> = ({
    videoRef, zoom, setZoom, flipCamera, capturePhoto, stopCamera, retake,
}) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full max-w-3xl mx-auto"
    >
        <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto"
                style={{ transform: zoom > 1 ? `scale(${zoom})` : undefined }}
            />

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="absolute top-[8%] left-[6%] right-[6%] bottom-[8%] bg-transparent border-2 border-dashed border-white/50 rounded-lg"
                    style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)' }}
                >
                    <div className="absolute -top-1 -left-1">
                        <div className="w-8 h-8 border-2 border-cyan-400 bg-cyan-400/10 flex items-center justify-center">
                            <div className="w-4 h-4 bg-cyan-400/30"></div>
                        </div>
                    </div>
                    <div className="absolute -top-1 -right-1">
                        <div className="w-8 h-8 border-2 border-cyan-400 bg-cyan-400/10 flex items-center justify-center">
                            <div className="w-4 h-4 bg-cyan-400/30"></div>
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -left-1">
                        <div className="w-8 h-8 border-2 border-cyan-400 bg-cyan-400/10 flex items-center justify-center">
                            <div className="w-4 h-4 bg-cyan-400/30"></div>
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                        <div className="w-8 h-8 border-2 border-cyan-400 bg-cyan-400/10 flex items-center justify-center">
                            <div className="w-4 h-4 bg-cyan-400/30"></div>
                        </div>
                    </div>

                    <div className="absolute top-0 left-8 right-8 h-0.5 bg-cyan-400/20"></div>
                    <div className="absolute bottom-0 left-8 right-8 h-0.5 bg-cyan-400/20"></div>
                    <div className="absolute left-0 top-8 bottom-8 w-0.5 bg-cyan-400/20"></div>
                    <div className="absolute right-0 top-8 bottom-8 w-0.5 bg-cyan-400/20"></div>

                    <motion.div
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </div>

                <div className="absolute top-[13%] left-0 right-0 text-center pointer-events-none z-10">
                    <span className="px-4 py-2 bg-black/70 text-white rounded-full text-sm backdrop-blur-sm font-medium inline-block max-w-[90%] shadow-lg">
                        Alinee los 4 cuadrados negros con las esquinas
                    </span>
                </div>
            </div>
        </div>

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
