'use client';

import React, { useState, useEffect } from 'react';
import {
    GraduationCap,
    BookOpen,
    Layers,
    Check,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchUnitsStatic, getAvailableOptions, Unit } from '@/shared/lib/staticCurriculum';
import { SUBJECTS, GRADES, ELECTIVES_LIST } from '@/shared/constants/curriculum';
import { useTestDesignerStore } from '@/features/summative/store/useTestDesignerStore';

export const StepConfiguration: React.FC = () => {
    const { testData: data, setTestData: onChange } = useTestDesignerStore();

    const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [validPairs, setValidPairs] = useState<Record<string, string[]>>({});

    // Load available options asynchronously
    useEffect(() => {
        getAvailableOptions().then(options => {
            setValidPairs(options.validPairs);
        });
    }, []);

    const validSubjectsForGrade = data.grade ? (validPairs[data.grade] || []) : [];

    // Determine if an elective is currently selected or if the "Electivo" category is active
    const isElectiveSelected = data.subject === 'Electivo' || ELECTIVES_LIST.includes(data.subject);

    useEffect(() => {
        const loadUnits = async () => {
            if (data.grade && data.subject && data.subject !== 'Electivo') {
                setLoadingUnits(true);

                // Fuzzy match for subject
                const jsonSubjectKey = validSubjectsForGrade.find(s =>
                    s.toLowerCase().includes(data.subject.toLowerCase()) ||
                    data.subject.toLowerCase().includes(s.toLowerCase())
                );

                // Special handling for exact matches in electives to avoid fuzzy issues
                const exactMatch = validSubjectsForGrade.find(s => s === data.subject);
                const finalKey = exactMatch || jsonSubjectKey;

                if (finalKey) {
                    const units = await fetchUnitsStatic(data.grade, finalKey);
                    setAvailableUnits(units);
                    if (data.unit && !units.some(u => u.name === data.unit)) {
                        onChange({ unit: '' });
                    }
                } else {
                    setAvailableUnits([]);
                }
                setLoadingUnits(false);
            } else {
                setAvailableUnits([]);
            }
        };
        loadUnits();
    }, [data.grade, data.subject]);

    const handleChange = (field: string, value: string) => {
        const newData: Record<string, string> = { [field]: value };
        if (field === 'grade') {
            newData.subject = '';
            newData.unit = '';
        }
        if (field === 'subject') {
            newData.unit = '';
        }
        onChange(newData);
    };

    return (
        <div className="space-y-10 animate-fade-in-up">

            {/* 1. Title Input - Transparent/Dark Style */}
            <div className="bg-[var(--card)]/30 p-6 rounded-2xl border border-[var(--border)]">
                <label className="block text-xs font-bold text-[var(--muted)] uppercase tracking-widest mb-2 ml-1">
                    Título de la Evaluación
                </label>
                <input
                    type="text"
                    className="w-full text-2xl font-bold text-[var(--on-background)] placeholder-[var(--muted)]/50 border-b-2 border-transparent focus:border-[var(--primary)] focus:outline-none py-2 px-1 transition-colors bg-transparent"
                    placeholder="Ej: Prueba Unidad 1: La Materia"
                    value={data.testTitle || ''}
                    onChange={(e) => handleChange('testTitle', e.target.value)}
                />
            </div>

            {/* 2. Grade Selection - Dark Pills */}
            <div>
                <label className="block text-sm font-bold mb-4 text-[var(--muted)] uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap size={16} /> Nivel / Curso
                </label>
                <div className="flex flex-wrap gap-3">
                    {GRADES.map((grade) => {
                        return (
                            <button
                                key={grade}
                                type="button"
                                onClick={() => handleChange('grade', grade)}
                                className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ${data.grade === grade
                                    ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-purple-500/30 transform scale-105'
                                    : 'bg-[var(--input-bg)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--muted)] hover:text-[var(--on-background)]'
                                    }`}
                            >
                                {grade}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. Subject Selection - Dark Cards */}
            <AnimatePresence>
                {data.grade && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        <label className="block text-sm font-bold mb-4 text-[var(--muted)] uppercase tracking-wider flex items-center gap-2">
                            <BookOpen size={16} /> Asignatura
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {SUBJECTS.map((sub) => {
                                // Logic:
                                // If sub.id is 'Electivo', check if it is active via isElectiveSelected
                                // If sub.id is NOT 'Electivo', check if it matches data.subject exactly

                                const isElectiveBtn = sub.id === 'Electivo';
                                const isActive = isElectiveBtn ? isElectiveSelected : data.subject === sub.id;

                                // Availability check (simplified for UI, actual validation happens in logic)
                                // Mostly useful for graying out if not available in grade, but user requested specific layout.
                                // We keep it enabled for now to allow selection, validation happens on unit load.

                                return (
                                    <button
                                        key={sub.id}
                                        type="button"
                                        onClick={() => handleChange('subject', sub.id)}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden h-28
                                            ${isActive
                                                ? 'bg-[var(--primary-bg)] border-[var(--primary)] shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                                                : 'bg-[var(--input-bg)] border-[var(--border)] hover:border-[var(--muted)] hover:bg-[var(--card-hover)]'
                                            }`}
                                    >
                                        <sub.icon size={28} className={`mb-1 transition-colors ${isActive ? 'text-[var(--primary)]' : 'text-[var(--muted)] group-hover:text-[var(--on-background)]'}`} />
                                        <span className={`text-xs font-bold text-center ${isActive ? 'text-[var(--primary)]' : 'text-[var(--muted)] group-hover:text-[var(--on-background)]'}`}>
                                            {sub.label}
                                        </span>
                                        {isActive && (
                                            <div className="absolute top-2 right-2 text-[var(--primary)]">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3.1 Elective Sub-Selection */}
            <AnimatePresence>
                {data.grade && isElectiveSelected && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-[var(--card)]/30 border border-[var(--primary)]/30 rounded-xl p-5 mt-2">
                            <h4 className="text-sm font-bold text-[var(--primary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <GraduationCap size={18} /> Selecciona el Electivo
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {ELECTIVES_LIST.map((elec) => (
                                    <button
                                        key={elec}
                                        type="button"
                                        onClick={() => handleChange('subject', elec)}
                                        className={`text-left px-4 py-3 rounded-lg text-sm transition-all ${data.subject === elec
                                            ? 'bg-[var(--primary)] text-white shadow-lg'
                                            : 'bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--input-bg)]'
                                            }`}
                                    >
                                        {elec}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. Unit Selection - Dark List */}
            <AnimatePresence>
                {data.grade && data.subject && data.subject !== 'Electivo' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <label className="block text-sm font-bold mb-4 text-[var(--muted)] uppercase tracking-wider flex items-center gap-2 mt-6">
                            <Layers size={16} /> Selección de Unidad
                        </label>

                        {loadingUnits ? (
                            <div className="p-8 text-center text-[var(--muted)] bg-[var(--card)]/30 rounded-xl border border-dashed border-[var(--border)] animate-pulse">
                                Cargando unidades disponibles...
                            </div>
                        ) : availableUnits.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {availableUnits.map((u) => {
                                    const unitName = u.name;
                                    // Logic to show preview if name is generic "Unidad X"
                                    const isGenericName = /^Unidad \d+$/i.test(unitName.trim());
                                    const firstOADesc = isGenericName && u.oas && u.oas.length > 0 ? u.oas[0].description : '';

                                    return (
                                        <button
                                            key={unitName}
                                            onClick={() => handleChange('unit', unitName)}
                                            className={`text-left p-5 rounded-xl border transition-all duration-200 flex flex-col justify-center group h-auto min-h-[5rem]
                                            ${data.unit === unitName
                                                    ? 'bg-[var(--card)] border-[var(--primary)] shadow-[0_0_15px_rgba(139,92,246,0.2)] z-10'
                                                    : 'bg-[var(--input-bg)] border-[var(--border)] hover:border-[var(--muted)] hover:bg-[var(--card-hover)]'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between w-full mb-1">
                                                <span className={`font-bold text-base ${data.unit === unitName ? 'text-[var(--primary)]' : 'text-[var(--on-background)]'}`}>
                                                    {unitName}
                                                </span>
                                                {data.unit === unitName && <CheckCircle2 className="text-[var(--primary)]" size={20} />}
                                            </div>

                                            {firstOADesc && (
                                                <span className="text-xs text-[var(--muted)] line-clamp-2 mt-1 font-normal opacity-80">
                                                    {firstOADesc}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-amber-900/10 rounded-xl border border-amber-900/30 text-amber-500">
                                <p className="font-medium">No se encontraron unidades para esta combinación.</p>
                                <p className="text-sm mt-1 opacity-80">Intenta seleccionar otro curso o asignatura.</p>
                            </div>
                        )}

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
