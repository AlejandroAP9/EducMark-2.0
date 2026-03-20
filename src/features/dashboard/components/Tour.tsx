'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { HelpCircle } from 'lucide-react';

const TOUR_KEY = 'educmark_tour_completed';
const TOUR_VERSION = '3'; // Increment to force re-show after major UI changes

/**
 * Tour Steps for Dashboard
 * 
 * Each step targets an element by ID with rich descriptions
 * to guide new users through the platform.
 */
const tourSteps: DriveStep[] = [
    {
        element: '#tour-stats',
        popover: {
            title: '📊 Tu Impacto',
            description: 'Aquí verás cuánto tiempo has ahorrado y las clases que has generado. <br/><br/><strong>Tip:</strong> ¡Cada clase te ahorra aprox. 45 minutos!',
            side: 'bottom',
            align: 'start',
        }
    },
    {
        element: '#tour-generator-btn',
        popover: {
            title: '✨ Genera tu primera clase',
            description: 'Haz clic aquí para crear una planificación completa. Solo necesitas elegir asignatura, nivel y OA.',
            side: 'left',
            align: 'start',
        }
    },
    {
        element: '#tour-usage',
        popover: {
            title: '📈 Tu Uso del Mes',
            description: 'Monitorea tus generaciones mensuales, imágenes premium y la actividad diaria. Aquí verás cuántos créditos te quedan.',
            side: 'top',
            align: 'center',
        }
    },
    {
        element: '#tour-history',
        popover: {
            title: '📁 Tus Kits de Clase',
            description: 'Todos los materiales generados aparecen aquí: planificaciones, presentaciones y quizzes. Puedes descargarlos o verlos cuando quieras.',
            side: 'top',
            align: 'center',
        }
    },
    {
        element: '#referral-button',
        popover: {
            title: '🎁 Invita y Gana',
            description: 'Invita a un colega y ambos reciben <strong>5 clases gratis</strong>. Comparte tu link por WhatsApp o copia el código.',
            side: 'bottom',
            align: 'end',
        }
    },
];

/**
 * Enhanced Tour Component
 * 
 * - Shows automatically for first-time users
 * - Version-aware: re-shows if UI changes significantly
 * - Includes "Help" button to re-trigger the tour
 * - Custom dark theme styling matching EducMark design
 */
export function Tour() {
    const [showHelpBtn, setShowHelpBtn] = useState(false);

    const startTour = useCallback(() => {
        const driverObj = driver({
            showProgress: true,
            animate: true,
            smoothScroll: true,
            allowClose: true,
            stagePadding: 8,
            stageRadius: 12,
            doneBtnText: '¡Empecemos! 🚀',
            nextBtnText: 'Siguiente →',
            prevBtnText: '← Atrás',
            progressText: '{{current}} de {{total}}',
            popoverClass: 'educmark-tour-popover',
            onDestroyed: () => {
                localStorage.setItem(TOUR_KEY, TOUR_VERSION);
            },
            steps: tourSteps,
        });

        // Delay to ensure DOM elements are rendered
        setTimeout(() => {
            driverObj.drive();
        }, 800);
    }, []);

    useEffect(() => {
        const seenVersion = localStorage.getItem(TOUR_KEY);

        if (!seenVersion || seenVersion !== TOUR_VERSION) {
            startTour();
        } else {
            setShowHelpBtn(true);
        }
    }, [startTour]);

    return (
        <>
            {/* Custom CSS for the dark-themed tour */}
            <style>{`
                .educmark-tour-popover {
                    background: rgba(20, 20, 40, 0.95) !important;
                    backdrop-filter: blur(20px) !important;
                    border: 1px solid rgba(164, 143, 255, 0.2) !important;
                    border-radius: 16px !important;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(164, 143, 255, 0.1) !important;
                    color: #e2e2f5 !important;
                    max-width: 340px !important;
                }
                .educmark-tour-popover .driver-popover-title {
                    font-size: 18px !important;
                    font-weight: 700 !important;
                    color: #fff !important;
                    font-family: 'Space Grotesk', sans-serif !important;
                }
                .educmark-tour-popover .driver-popover-description {
                    font-size: 14px !important;
                    line-height: 1.6 !important;
                    color: #b0b0cc !important;
                }
                .educmark-tour-popover .driver-popover-description strong {
                    color: #a48fff !important;
                }
                .educmark-tour-popover .driver-popover-progress-text {
                    color: #666 !important;
                    font-size: 12px !important;
                }
                .educmark-tour-popover button {
                    border-radius: 8px !important;
                    font-weight: 600 !important;
                    font-size: 13px !important;
                    padding: 8px 16px !important;
                    transition: all 0.2s !important;
                }
                .educmark-tour-popover .driver-popover-next-btn {
                    background: linear-gradient(135deg, #a48fff 0%, #8080ff 100%) !important;
                    color: white !important;
                    border: none !important;
                    box-shadow: 0 4px 12px rgba(164, 143, 255, 0.3) !important;
                }
                .educmark-tour-popover .driver-popover-next-btn:hover {
                    transform: translateY(-1px) !important;
                    box-shadow: 0 6px 16px rgba(164, 143, 255, 0.4) !important;
                }
                .educmark-tour-popover .driver-popover-prev-btn {
                    background: rgba(255, 255, 255, 0.06) !important;
                    color: #b0b0cc !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                }
                .educmark-tour-popover .driver-popover-close-btn {
                    color: #666 !important;
                }
                .educmark-tour-popover .driver-popover-close-btn:hover {
                    color: #fff !important;
                }
                .driver-overlay {
                    background: rgba(10, 10, 20, 0.75) !important;
                }
            `}</style>

            {/* Re-trigger Tour Button */}
            {showHelpBtn && (
                <button
                    onClick={() => {
                        localStorage.removeItem(TOUR_KEY);
                        startTour();
                    }}
                    className="fixed bottom-6 right-6 z-50 p-3 bg-[var(--primary)]/20 border border-[var(--primary)]/30 rounded-full text-[var(--primary)] hover:bg-[var(--primary)]/30 hover:scale-110 transition-all duration-300 shadow-lg shadow-[var(--primary)]/10 backdrop-blur-md group"
                    title="Repetir Tour"
                >
                    <HelpCircle size={20} className="group-hover:rotate-12 transition-transform" />
                </button>
            )}
        </>
    );
}
