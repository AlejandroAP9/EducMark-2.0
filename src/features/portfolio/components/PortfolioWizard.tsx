'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { usePortfolioBuilder } from '../hooks/usePortfolioBuilder';
import { usePortfolioStore } from '../store/usePortfolioStore';
import type { GeneratedClassRow } from '../types/portfolio';

// Las asignaturas y cursos se cargan dinámicamente desde las clases del usuario

const STEP_LABELS = [
  'Asignatura y curso',
  'Seleccionar clases',
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <React.Fragment key={step}>
            {i > 0 && (
              <div
                className={`h-px w-8 ${
                  isCompleted ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--primary)] text-white'
                    : isCompleted
                    ? 'bg-[var(--primary)]/30 text-[var(--primary)]'
                    : 'bg-[var(--input-bg)] text-[var(--muted)]'
                }`}
              >
                {isCompleted ? '✓' : step}
              </div>
              <span
                className={`text-xs ${
                  isActive ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'
                }`}
              >
                {label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ClassCard({
  cls,
  selected,
  onToggle,
  disabled,
}: {
  cls: GeneratedClassRow;
  selected: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const fecha = new Date(cls.created_at).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !selected}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? 'bg-[var(--primary)]/10 border-[var(--primary)] ring-1 ring-[var(--primary)]/50'
          : disabled
          ? 'bg-[var(--input-bg)] border-[var(--card-border)] opacity-50 cursor-not-allowed'
          : 'bg-[var(--input-bg)] border-[var(--border)] hover:border-[var(--primary)]/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--foreground)] font-medium truncate">
            {cls.topic ?? cls.objetivo_clase ?? '(Sin tema)'}
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">{fecha}</p>
          {cls.oa_label && (
            <p className="text-xs text-[var(--secondary)] mt-1 truncate">
              {cls.oa_label}
            </p>
          )}
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${
            selected
              ? 'border-[var(--primary)] bg-[var(--primary)]'
              : 'border-[var(--border)]'
          }`}
        >
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}


export default function PortfolioWizard() {
  const {
    wizardState,
    data,
    nextStep,
    prevStep,
    setAsignaturaCurso,
    setSelectedClasses,
    getSelectedClassObjects,
  } = usePortfolioBuilder();

  const store = usePortfolioStore();

  const [localAsignatura, setLocalAsignatura] = useState('');
  const [localCurso, setLocalCurso] = useState('');
  const [localPeriodo, setLocalPeriodo] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleStep1Continue = useCallback(() => {
    if (!localAsignatura || !localCurso) return;
    setAsignaturaCurso(localAsignatura, localCurso, localPeriodo);
    nextStep();
  }, [localAsignatura, localCurso, localPeriodo, setAsignaturaCurso, nextStep]);

  const handleClassToggle = useCallback(
    (classId: string) => {
      const current = wizardState.selectedClasses;
      if (current.includes(classId)) {
        setSelectedClasses(current.filter((id) => id !== classId));
      } else if (current.length < 3) {
        setSelectedClasses([...current, classId]);
      }
    },
    [wizardState.selectedClasses, setSelectedClasses]
  );

  const handleGenerateDrafts = useCallback(async () => {
    const selectedClasses = getSelectedClassObjects();
    if (selectedClasses.length === 0) return;

    setGenerating(true);
    toast.info('Generando borradores con IA... esto puede tomar 30 segundos');

    try {
      const res = await fetch('/api/portfolio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classes: selectedClasses,
          asignatura: wizardState.asignatura,
          curso: wizardState.curso,
          userId: data.userId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${res.status}`);
      }

      const drafts = await res.json();
      store.setDraft(drafts.t1 || '', drafts.t2 || '', drafts.t3 || '');
      store.setWizardCompleted(true);
      toast.success('Borradores generados exitosamente');
    } catch (err) {
      console.error('Error generando borradores:', err);
      toast.error(err instanceof Error ? err.message : 'Error al generar borradores');
    } finally {
      setGenerating(false);
    }
  }, [
    getSelectedClassObjects,
    wizardState.asignatura,
    wizardState.curso,
    data.userId,
    store,
  ]);

  const canGenerate = wizardState.selectedClasses.length >= 1;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <StepIndicator currentStep={wizardState.step} />

      <AnimatePresence mode="wait">
        {/* STEP 1: Seleccion de asignatura, curso, periodo */}
        {wizardState.step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
                Selecciona asignatura y curso
              </h3>
              <p className="text-sm text-[var(--muted)]">
                Buscaremos tus clases y evaluaciones generadas en EducMark
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">
                  Asignatura
                </label>
                <select
                  value={localAsignatura}
                  onChange={(e) => setLocalAsignatura(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors appearance-none"
                >
                  <option value="" className="bg-[var(--card)] text-[var(--foreground)]">
                    Seleccionar...
                  </option>
                  {data.availableAsignaturas.map((a) => (
                    <option key={a} value={a} className="bg-[var(--card)] text-[var(--foreground)]">
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">
                  Curso
                </label>
                <select
                  value={localCurso}
                  onChange={(e) => setLocalCurso(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors appearance-none"
                >
                  <option value="" className="bg-[var(--card)] text-[var(--foreground)]">
                    Seleccionar...
                  </option>
                  {data.availableCursos.map((c) => (
                    <option key={c} value={c} className="bg-[var(--card)] text-[var(--foreground)]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">
                  Periodo (opcional)
                </label>
                <input
                  type="text"
                  value={localPeriodo}
                  onChange={(e) => setLocalPeriodo(e.target.value)}
                  placeholder="Ej: Primer semestre 2026"
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleStep1Continue}
              disabled={!localAsignatura || !localCurso}
              className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              Continuar
            </button>
          </motion.div>
        )}

        {/* STEP 2: Seleccionar experiencias de aprendizaje */}
        {wizardState.step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
                Selecciona hasta 3 experiencias
              </h3>
              <p className="text-sm text-[var(--muted)]">
                Estas clases se incluiran en la Tarea 1 de tu portafolio
              </p>
            </div>

            {data.loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-sm text-[var(--muted)]">
                  Cargando clases...
                </span>
              </div>
            ) : data.classes.length === 0 ? (
              <div className="text-center py-12 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl">
                <p className="text-[var(--muted)] text-sm">
                  No se encontraron clases para esta asignatura y curso.
                </p>
                <p className="text-[var(--muted)] opacity-60 text-xs mt-1">
                  Genera clases primero desde el Generador de Clases.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.classes.map((cls) => (
                  <ClassCard
                    key={cls.id}
                    cls={cls}
                    selected={wizardState.selectedClasses.includes(cls.id)}
                    onToggle={() => handleClassToggle(cls.id)}
                    disabled={wizardState.selectedClasses.length >= 3}
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-[var(--muted)] opacity-60 text-center">
              {wizardState.selectedClasses.length}/3 seleccionadas
            </p>

            <div className="flex gap-3">
              <button
                onClick={prevStep}
                className="flex-1 border border-[var(--border)] hover:bg-[var(--card-hover)] text-[var(--foreground)] font-medium py-3 px-6 rounded-xl transition-all"
              >
                Volver
              </button>
              <button
                onClick={handleGenerateDrafts}
                disabled={!canGenerate || generating}
                className="flex-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generando con IA...
                  </span>
                ) : (
                  'Generar Borradores con IA'
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
