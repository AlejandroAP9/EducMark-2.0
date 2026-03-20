'use client';

import React, { useEffect, useState } from 'react';
import { Layers, Trash2, Plus, Info, Type, Sparkles, RefreshCw } from 'lucide-react';
import { fetchOAsStatic } from '@/shared/lib/staticCurriculum';
import { toast } from 'sonner';
import { useTestDesignerStore, BlueprintRow } from '@/features/summative/store/useTestDesignerStore';

const ITEM_TYPES = [
    'Selección Múltiple',
    'Verdadero o Falso',
    'Términos Pareados',
    'Completación',
    'Respuesta Breve',
    'Desarrollo',
    'Ordenamiento',
    'Doble Proceso'
];

export const StepBlueprint: React.FC = () => {
    const {
        blueprint,
        setBlueprint: onChange,
        testData
    } = useTestDesignerStore();

    const { unit, grade, subject } = testData;

    const [availableOAs, setAvailableOAs] = useState<{ label: string; id?: string; description: string; topic?: string }[]>([]);
    const [loadingOAs, setLoadingOAs] = useState(false);
    const totalQuestions = blueprint.reduce((acc, row) => acc + row.count, 0);

    const loadOAs = async (forcePopulate = false) => {
        if (grade && subject && unit) {
            setLoadingOAs(true);
            if (forcePopulate) {
                toast.info(`Cargando OAs para la unidad ${unit}...`);
            }
            const oas = await fetchOAsStatic(grade, subject, unit);

            // Normalize OAs to ensure they all have a 'label' field
            const normalizedOAs = oas.map(oa => ({
                ...oa,
                label: oa.label || oa.id || 'OA',
            }));

            // Deduplicate OAs based on label
            const uniqueOAs = normalizedOAs.filter((oa, index, self) =>
                index === self.findIndex((t) => t.label === oa.label)
            );

            const sortedOAs = uniqueOAs.sort((a, b) => {
                const labelA = a.label || '';
                const labelB = b.label || '';
                return labelA.localeCompare(labelB, undefined, { numeric: true });
            });

            setAvailableOAs(sortedOAs);
            setLoadingOAs(false);

            if (forcePopulate) {
                toast.success(`Se encontraron ${sortedOAs.length} OAs para ${unit}`);
            }

            // Auto-populate logic: If blueprint is empty or has only the initial empty row, populate with all OAs
            // OR if forcePopulate is true
            const isDefault = blueprint.length === 0 || (blueprint.length === 1 && blueprint[0].oa === 'OA 01' && blueprint[0].count === 1);

            if ((isDefault || forcePopulate) && sortedOAs.length > 0) {
                const newBlueprint = sortedOAs.map((oa, index) => ({
                    id: index + 1,
                    oa: oa.label,
                    topic: oa.topic || 'General',
                    skill: 'Recordar',
                    itemType: 'Selección Múltiple',
                    count: 2 // Default count per OA
                }));
                onChange(newBlueprint);
            }
        }
    };

    useEffect(() => {
        loadOAs(false);
    }, [grade, subject, unit]); // Removed 'blueprint' from deps to avoid infinite loop, relying on initial check

    const handleUpdateRow = (id: number, updates: Partial<BlueprintRow>) => {
        const newBlueprint = blueprint.map(row => row.id === id ? { ...row, ...updates } : row);
        onChange(newBlueprint);
    };

    const handleOAGauge = (id: number, oaLabel: string) => {
        // Find the OA data to auto-fill topic if possible
        const oaData = availableOAs.find(o => o.label === oaLabel);
        const updates: Partial<BlueprintRow> = { oa: oaLabel };
        if (oaData && oaData.topic) {
            updates.topic = oaData.topic;
        }
        handleUpdateRow(id, updates);
    };

    const handleRemoveRow = (id: number) => {
        onChange(blueprint.filter(row => row.id !== id));
    };

    const handleAddRow = () => {
        const newId = Math.max(0, ...blueprint.map(b => b.id)) + 1;
        const defaultOA = availableOAs.length > 0 ? availableOAs[0].label : 'OA 01';
        const defaultTopic = availableOAs.length > 0 ? (availableOAs[0].topic ?? 'General') : 'General';
        onChange([...blueprint, { id: newId, oa: defaultOA, topic: defaultTopic, skill: 'Recordar', itemType: 'Selección Múltiple', count: 1 }]);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up font-[var(--font-body)]">
            {/* Header Info Card */}
            <div className="glass-card-premium p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group">
                {/* Subtle gradient accent top */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] opacity-30"></div>

                {/* Neural background for header */}
                <div className="neural-bg opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
                    <div className="neural-orb orb-1" style={{ right: '-5%', top: '-50%', width: '200px', height: '200px', background: 'var(--primary)' }}></div>
                </div>

                <div className="flex gap-5 items-start relative z-10 w-full md:w-auto">
                    <div className="p-3 bg-white/5 text-[var(--on-background)] rounded-xl h-fit border border-white/10 shadow-sm backdrop-blur-sm">
                        <Layers size={24} className="opacity-80" />
                    </div>
                    <div>
                        <strong className="text-xl block mb-2 text-[var(--on-background)] tracking-tight font-[var(--font-heading)]">Tabla de Especificaciones</strong>
                        <div className="flex flex-col gap-1 text-sm text-[var(--muted)]">
                            <span className="flex items-center gap-2">
                                Unidad Seleccionada:
                                <span className="font-bold text-[var(--on-background)] bg-[var(--input-bg)] px-3 py-0.5 rounded-full border border-[var(--border)] text-xs uppercase tracking-wide">
                                    {unit || 'No seleccionada'}
                                </span>
                            </span>
                            {loadingOAs && <span className="text-xs animate-pulse text-[var(--secondary)] flex items-center gap-1">
                                <Sparkles size={12} /> Consultando Curriculum...
                            </span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 bg-[var(--input-bg)] p-4 rounded-xl border border-[var(--border)] shadow-inner w-full md:w-auto justify-between md:justify-end">
                    {/* Manual Reload Button */}
                    <button
                        onClick={() => loadOAs(true)}
                        className="p-2 rounded-lg hover:bg-[var(--card)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors flex flex-col items-center gap-1 group"
                        title="Recargar OAs"
                    >
                        <RefreshCw size={18} className={`group-hover:rotate-180 transition-transform duration-500 ${loadingOAs ? 'animate-spin' : ''}`} />
                        <span className="text-[10px] uppercase tracking-wider font-bold">Cargar OAs</span>
                    </button>

                    <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted)] block mb-1">Total Ítems</span>
                        <div className="text-4xl font-bold text-[var(--on-background)] leading-none font-[var(--font-heading)]">{totalQuestions}</div>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-[var(--card)]/40 backdrop-blur-md border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5 overflow-x-auto min-h-[400px]">
                <table className="w-full text-left min-w-[900px]">
                    <thead className="bg-[var(--input-bg)] text-[var(--muted)] text-xs uppercase font-bold tracking-wider border-b border-[var(--border)]">
                        <tr>
                            <th className="p-5 w-40">Objetivo (OA)</th>
                            <th className="p-5">Eje / Contenido</th>
                            <th className="p-5 w-48">Habilidad</th>
                            <th className="p-5 w-56">Tipo de Ítem</th>
                            <th className="p-5 w-32 text-center">Cant.</th>
                            <th className="p-5 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {blueprint.map((row) => (
                            <tr key={row.id} className="hover:bg-[var(--card-hover)] transition-colors group">
                                <td className="p-5">
                                    <div className="relative group/oa">
                                        {availableOAs.length > 0 ? (
                                            <div className="relative">
                                                <select
                                                    value={row.oa}
                                                    onChange={(e) => handleOAGauge(row.id, e.target.value)}
                                                    className="w-full appearance-none bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--on-background)] px-3 py-2 rounded-lg text-sm font-bold border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all cursor-pointer shadow-sm"
                                                >
                                                    {availableOAs.map(oa => (
                                                        <option key={oa.label} value={oa.label} className="bg-gray-900 text-white">{oa.label}</option>
                                                    ))}
                                                </select>
                                                {/* Tooltip for OA Description — scoped to OA cell only */}
                                                <div className="absolute left-0 top-full mt-2 w-72 p-4 bg-[#1a1a2e] border border-[var(--border)] rounded-xl shadow-2xl opacity-0 group-hover/oa:opacity-100 transition-opacity pointer-events-none z-50 text-xs text-[var(--muted)] leading-relaxed">
                                                    <strong className="block text-[var(--on-background)] mb-1">{row.oa}</strong>
                                                    {availableOAs.find(o => o.label === row.oa)?.description || 'Sin descripción'}
                                                </div>
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                value={row.oa}
                                                onChange={(e) => handleUpdateRow(row.id, { oa: e.target.value })}
                                                className="bg-[var(--input-bg)] text-[var(--on-background)] w-full px-3 py-2 rounded-lg border border-[var(--border)] focus:border-[var(--primary)] outline-none"
                                                placeholder="OA X"
                                            />
                                        )}
                                    </div>
                                </td>
                                <td className="p-5 semi-bold">
                                    <input
                                        type="text"
                                        value={row.topic}
                                        onChange={(e) => handleUpdateRow(row.id, { topic: e.target.value })}
                                        className="w-full text-sm font-medium text-[var(--on-background)] bg-transparent hover:bg-[var(--input-bg)] focus:bg-[var(--input-bg)] border border-transparent focus:border-[var(--primary)] rounded-lg px-3 py-2 outline-none transition-all placeholder-[var(--muted)]/50 focus:placeholder-transparent truncate"
                                        placeholder="Escribe el tema..."
                                    />
                                </td>
                                <td className="p-5">
                                    <select
                                        value={row.skill}
                                        onChange={(e) => handleUpdateRow(row.id, { skill: e.target.value })}
                                        className="w-full text-sm px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--on-background)] font-medium outline-none cursor-pointer hover:border-[var(--primary)] focus:border-[var(--primary)] transition-all appearance-none"
                                    >
                                        <option className="bg-gray-900 text-white">Recordar</option>
                                        <option className="bg-gray-900 text-white">Comprender</option>
                                        <option className="bg-gray-900 text-white">Aplicar</option>
                                        <option className="bg-gray-900 text-white">Analizar</option>
                                        <option className="bg-gray-900 text-white">Evaluar</option>
                                        <option className="bg-gray-900 text-white">Crear</option>
                                    </select>
                                </td>
                                <td className="p-5">
                                    <div className="relative">
                                        <Type size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                                        <select
                                            value={row.itemType || 'Selección Múltiple'}
                                            onChange={(e) => handleUpdateRow(row.id, { itemType: e.target.value })}
                                            className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--on-background)] font-medium outline-none cursor-pointer hover:border-[var(--primary)] focus:border-[var(--primary)] transition-all appearance-none"
                                        >
                                            {ITEM_TYPES.map(t => <option key={t} className="bg-gray-900 text-white">{t}</option>)}
                                        </select>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="flex items-center justify-center gap-1 bg-[var(--input-bg)] rounded-lg p-1 border border-[var(--border)] shadow-inner">
                                        <button
                                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--card)] text-[var(--muted)] hover:text-white transition-all active:scale-95 text-lg"
                                            onClick={() => handleUpdateRow(row.id, { count: Math.max(0, row.count - 1) })}
                                        > - </button>
                                        <span className="font-bold text-[var(--on-background)] w-6 text-center text-sm">{row.count}</span>
                                        <button
                                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--card)] text-[var(--muted)] hover:text-white transition-all active:scale-95 text-lg"
                                            onClick={() => handleUpdateRow(row.id, { count: row.count + 1 })}
                                        > + </button>
                                    </div>
                                </td>
                                <td className="p-5 text-center">
                                    <button
                                        onClick={() => handleRemoveRow(row.id)}
                                        className="p-2 text-[var(--muted)] hover:text-[var(--danger)] hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Eliminar fila"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {/* Add Row Button - Consistent Style */}
                        <tr className="bg-[var(--input-bg)]/30">
                            <td colSpan={6} className="p-3">
                                <button
                                    onClick={handleAddRow}
                                    className="w-full py-3 border border-dashed border-[var(--border)] rounded-xl text-[var(--muted)] font-bold hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <div className="bg-[var(--card)] text-[var(--muted)] rounded-full p-1 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                                        <Plus size={16} />
                                    </div>
                                    <span>Agregar Nueva Fila de Especificación</span>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end animate-fade-in delay-200">
                <div className="flex items-center gap-2 text-xs text-[var(--muted)] bg-[var(--card)] border border-[var(--border)] px-4 py-2 rounded-full shadow-sm">
                    <Info size={14} className="text-[var(--primary)]" />
                    <span>Los OAs se han cargado automáticamente según la <strong>{unit || 'Unidad'}</strong> seleccionada.</span>
                </div>
            </div>
        </div>
    );
};
