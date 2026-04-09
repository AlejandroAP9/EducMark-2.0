'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Check, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface StudentOption {
    id: string;
    first_name: string;
    last_name: string;
    rut?: string | null;
}

interface StudentAutocompleteProps {
    /** Curso del profe (ej: "8° Basico"). Si esta vacio, se queda en modo texto libre puro. */
    grade: string;
    /** Valor actual del campo nombre. */
    value: string;
    /** student_id seleccionado (null si es texto libre). */
    selectedId: string | null;
    onChange: (next: { name: string; studentId: string | null }) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

/**
 * Input con autocomplete contra la tabla `students` filtrada por `course_grade`.
 * - Si `grade` esta vacio o no hay alumnos cargados: actua como input libre.
 * - Si se escribe un nombre que coincide con un alumno existente, al elegirlo se guarda `student_id`.
 * - Si no hay coincidencia, el valor queda como texto libre y `selectedId` se limpia.
 *
 * Carga los alumnos del curso UNA sola vez al montar (o cuando cambia `grade`).
 */
export const StudentAutocomplete: React.FC<StudentAutocompleteProps> = ({
    grade,
    value,
    selectedId,
    onChange,
    placeholder = 'Nombre del alumno',
    autoFocus = false,
}) => {
    const [students, setStudents] = useState<StudentOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightIdx, setHighlightIdx] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch students for this grade once
    useEffect(() => {
        const gradeTrim = grade.trim();
        if (!gradeTrim) {
            setStudents([]);
            return;
        }
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const supabase = createClient();
                const { data: userData } = await supabase.auth.getUser();
                const userId = userData?.user?.id;
                if (!userId) {
                    if (!cancelled) setStudents([]);
                    return;
                }
                const { data, error } = await supabase
                    .from('students')
                    .select('id, first_name, last_name, rut')
                    .eq('user_id', userId)
                    .eq('course_grade', gradeTrim)
                    .order('last_name', { ascending: true });
                if (error) throw error;
                if (!cancelled) setStudents((data as StudentOption[]) || []);
            } catch (err) {
                console.warn('[StudentAutocomplete] Could not load students:', err);
                if (!cancelled) setStudents([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [grade]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Autofocus if requested
    useEffect(() => {
        if (autoFocus) {
            const t = setTimeout(() => inputRef.current?.focus(), 50);
            return () => clearTimeout(t);
        }
    }, [autoFocus]);

    // Filter students by current value
    const query = value.trim().toLowerCase();
    const filtered = query
        ? students
              .filter((s) => {
                  const full = `${s.first_name} ${s.last_name}`.toLowerCase();
                  const inverse = `${s.last_name} ${s.first_name}`.toLowerCase();
                  return full.includes(query) || inverse.includes(query);
              })
              .slice(0, 8)
        : students.slice(0, 8);

    const hasExactMatch = students.some(
        (s) => `${s.first_name} ${s.last_name}`.toLowerCase() === query
    );

    const handleSelect = useCallback(
        (s: StudentOption) => {
            onChange({
                name: `${s.first_name} ${s.last_name}`,
                studentId: s.id,
            });
            setShowDropdown(false);
        },
        [onChange]
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showDropdown || filtered.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[highlightIdx]) handleSelect(filtered[highlightIdx]);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => {
                        onChange({ name: e.target.value, studentId: null });
                        setHighlightIdx(0);
                        setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-[var(--on-background)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
                {selectedId && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                        <Check size={16} />
                    </div>
                )}
            </div>

            {/* Hint line */}
            {grade.trim() && (
                <p className="mt-1.5 text-xs text-[var(--muted)]">
                    {loading
                        ? `Cargando alumnos de ${grade}...`
                        : students.length === 0
                          ? `No hay alumnos en "${grade}" cargados en Gestion de Alumnos. Podes escribir el nombre libremente.`
                          : selectedId
                            ? `Alumno vinculado · se guardara con historial.`
                            : `${students.length} alumno${students.length === 1 ? '' : 's'} en ${grade}. Elegi de la lista o escribi libremente.`}
                </p>
            )}

            {/* Dropdown */}
            {showDropdown && filtered.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-[#0b0b15] border border-[var(--border)] rounded-xl shadow-2xl">
                    {filtered.map((s, i) => {
                        const fullName = `${s.first_name} ${s.last_name}`;
                        const isHighlighted = i === highlightIdx;
                        const isSelected = selectedId === s.id;
                        return (
                            <button
                                key={s.id}
                                type="button"
                                onMouseEnter={() => setHighlightIdx(i)}
                                onClick={() => handleSelect(s)}
                                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                                    isHighlighted
                                        ? 'bg-[var(--primary)]/15 text-[var(--on-background)]'
                                        : 'text-[var(--muted)] hover:text-[var(--on-background)]'
                                }`}
                            >
                                <span className="text-sm font-medium">{fullName}</span>
                                {isSelected && <Check size={14} className="text-emerald-400" />}
                                {s.rut && !isSelected && (
                                    <span className="text-[10px] text-[var(--muted)]/60">{s.rut}</span>
                                )}
                            </button>
                        );
                    })}
                    {query && !hasExactMatch && (
                        <div className="px-4 py-2 border-t border-[var(--border)] text-xs text-[var(--muted)] flex items-center gap-2">
                            <UserPlus size={12} />
                            Se guardara como texto libre: &quot;{value}&quot;
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
