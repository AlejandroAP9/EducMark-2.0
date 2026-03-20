'use client';

import React from 'react';
import { Download, Table, FileSpreadsheet } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AssessmentItem {
    id: string; // or number, depends on your system
    unit: string;
    oa: string;
    question: string;
    indicator?: string;
    skill: string;
    bloom_level?: string;
    score?: number;
    correctAnswer: string;
}

interface SpecificationTableProps {
    items: AssessmentItem[];
    title: string;
    subject: string;
    grade: string;
}

export const SpecificationTable: React.FC<SpecificationTableProps> = ({ items, title, subject, grade }) => {

    const totalScore = items.reduce((sum, item) => sum + (item.score || 2), 0);

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(16);
        doc.text('Tabla de Especificaciones', 14, 20);
        doc.setFontSize(10);
        doc.text(`Evaluación: ${title}`, 14, 28);
        doc.text(`Asignatura: ${subject} | Curso: ${grade}`, 14, 34);

        // Table Data
        const tableData = items.map((item, index) => [
            index + 1,
            item.oa || 'General',
            item.indicator || 'N/A',
            item.skill,
            item.correctAnswer,
            item.score || 2
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['N°', 'OA', 'Indicador de Evaluación', 'Habilidad', 'Clave', 'Pts']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
            foot: [['', '', '', 'Total', '', totalScore]],
        });

        doc.save(`${title.replace(/\s+/g, '_')}_Tabla_Especificaciones.pdf`);
    };

    return (
        <div className="glass-card-premium p-0 overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--card)]/50">
                <div>
                    <h3 className="text-lg font-bold text-[var(--on-background)] flex items-center gap-2 font-heading">
                        <Table size={20} className="text-[var(--primary)]" />
                        Tabla de Especificaciones
                    </h3>
                    <p className="text-sm text-[var(--muted)]">Matriz técnica de validación curricular (UTP)</p>
                </div>
                <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 rounded-lg hover:bg-[var(--primary)]/20 transition-all font-medium text-sm"
                >
                    <Download size={18} />
                    Descargar PDF
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[var(--muted)] uppercase bg-[var(--card)]/30 border-b border-[var(--border)]">
                        <tr>
                            <th className="px-6 py-3 font-semibold tracking-wider">N°</th>
                            <th className="px-6 py-3 font-semibold tracking-wider">Objetivo (OA)</th>
                            <th className="px-6 py-3 w-1/3 font-semibold tracking-wider">Indicador de Evaluación</th>
                            <th className="px-6 py-3 font-semibold tracking-wider">Habilidad</th>
                            <th className="px-6 py-3 text-center font-semibold tracking-wider">Clave</th>
                            <th className="px-6 py-3 text-right font-semibold tracking-wider">Puntaje</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {items.map((item, index) => (
                            <tr key={index} className="hover:bg-[var(--on-background)]/5 transition-colors">
                                <td className="px-6 py-4 font-medium text-[var(--on-background)]">{index + 1}</td>
                                <td className="px-6 py-4 text-[var(--primary)] font-medium">{item.oa}</td>
                                <td className="px-6 py-4 text-[var(--foreground)]/80">{item.indicator || <span className="text-[var(--muted)] italic">No especificado</span>}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md text-xs font-semibold border border-blue-500/20">
                                        {item.skill}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-[var(--on-background)]">{item.correctAnswer}</td>
                                <td className="px-6 py-4 text-right font-medium text-[var(--on-background)]">{item.score || 2}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-[var(--card)]/30 border-t border-[var(--border)] font-semibold text-[var(--on-background)]">
                        <tr>
                            <td colSpan={5} className="px-6 py-3 text-right text-[var(--muted)]">Puntaje Total del Instrumento:</td>
                            <td className="px-6 py-3 text-right text-[var(--primary)] font-bold text-base">{totalScore} pts</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer / Disclaimer for Teachers */}
            <div className="px-6 py-4 bg-yellow-500/5 border-t border-yellow-500/10 flex items-start gap-3">
                <FileSpreadsheet className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-yellow-200/80">
                    <strong className="text-yellow-500">Nota para UTP:</strong> Esta tabla valida que los ítems generados corresponden a los indicadores del currículum vigente.
                    El puntaje es editable en la configuración de la prueba si se requiere ponderación diferente.
                </p>
            </div>
        </div>
    );
};
