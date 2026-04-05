'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolioBuilder } from '../hooks/usePortfolioBuilder';
import { useDraftGenerator } from '../hooks/useDraftGenerator';
import { usePortfolioStore } from '../store/usePortfolioStore';
import type { GeneratedClassRow, EvaluationRow } from '../types/portfolio';

// Las asignaturas y cursos se cargan dinámicamente desde las clases del usuario

const STEP_LABELS = [
  'Selección',
  'Experiencias',
  'Evaluación',
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
                  isCompleted ? 'bg-[#8B5CF6]' : 'bg-white/10'
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#8B5CF6] text-white'
                    : isCompleted
                    ? 'bg-[#8B5CF6]/30 text-[#8B5CF6]'
                    : 'bg-white/5 text-white/40'
                }`}
              >
                {isCompleted ? '✓' : step}
              </div>
              <span
                className={`text-xs ${
                  isActive ? 'text-[#F8F9FA]' : 'text-white/40'
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
          ? 'bg-[#8B5CF6]/10 border-[#8B5CF6] ring-1 ring-[#8B5CF6]/50'
          : disabled
          ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#F8F9FA] font-medium truncate">
            {cls.topic ?? cls.objetivo_clase ?? '(Sin tema)'}
          </p>
          <p className="text-xs text-white/40 mt-1">{fecha}</p>
          {cls.oa_label && (
            <p className="text-xs text-[#06B6D4] mt-1 truncate">
              {cls.oa_label}
            </p>
          )}
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${
            selected
              ? 'border-[#8B5CF6] bg-[#8B5CF6]'
              : 'border-white/20'
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

function EvaluationCard({
  evaluation,
  selected,
  onSelect,
  hasOMR,
}: {
  evaluation: EvaluationRow;
  selected: boolean;
  onSelect: () => void;
  hasOMR?: boolean;
}) {
  const fecha = new Date(evaluation.created_at).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? 'bg-[#8B5CF6]/10 border-[#8B5CF6] ring-1 ring-[#8B5CF6]/50'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#F8F9FA] font-medium truncate">
            {evaluation.title}
          </p>
          <p className="text-xs text-white/40 mt-1">{fecha}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasOMR && (
            <span className="text-[10px] bg-[#06B6D4]/20 text-[#06B6D4] px-2 py-0.5 rounded-full">
              OMR
            </span>
          )}
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selected
                ? 'border-[#8B5CF6] bg-[#8B5CF6]'
                : 'border-white/20'
            }`}
          >
            {selected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
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
    setSelectedEvaluation,
    getSelectedClassObjects,
  } = usePortfolioBuilder();

  const { generateDraftT1, generateDraftT2, generateDraftT3 } =
    useDraftGenerator();
  const store = usePortfolioStore();

  const [localAsignatura, setLocalAsignatura] = useState('');
  const [localCurso, setLocalCurso] = useState('');
  const [localPeriodo, setLocalPeriodo] = useState('');

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

  const handleGenerateDrafts = useCallback(() => {
    const selectedClasses = getSelectedClassObjects();
    const t1 = generateDraftT1(selectedClasses, store.guidedAnswers);
    const t2 = generateDraftT2(
      data.evaluationItems,
      data.omrResults,
      store.guidedAnswers
    );
    const t3 = generateDraftT3();

    store.setDraft(t1, t2, t3);
    store.setWizardCompleted(true);
  }, [
    getSelectedClassObjects,
    generateDraftT1,
    generateDraftT2,
    generateDraftT3,
    data.evaluationItems,
    data.omrResults,
    store,
  ]);

  const canContinueStep2 = wizardState.selectedClasses.length >= 1;
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
              <h3 className="text-lg font-semibold text-[#F8F9FA] mb-1">
                Selecciona asignatura y curso
              </h3>
              <p className="text-sm text-white/50">
                Buscaremos tus clases y evaluaciones generadas en EducMark
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">
                  Asignatura
                </label>
                <select
                  value={localAsignatura}
                  onChange={(e) => setLocalAsignatura(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#F8F9FA] focus:outline-none focus:border-[#8B5CF6] transition-colors appearance-none"
                >
                  <option value="" className="bg-[#0a0a0f]">
                    Seleccionar...
                  </option>
                  {data.availableAsignaturas.map((a) => (
                    <option key={a} value={a} className="bg-[#0a0a0f]">
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1.5">
                  Curso
                </label>
                <select
                  value={localCurso}
                  onChange={(e) => setLocalCurso(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#F8F9FA] focus:outline-none focus:border-[#8B5CF6] transition-colors appearance-none"
                >
                  <option value="" className="bg-[#0a0a0f]">
                    Seleccionar...
                  </option>
                  {data.availableCursos.map((c) => (
                    <option key={c} value={c} className="bg-[#0a0a0f]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1.5">
                  Periodo (opcional)
                </label>
                <input
                  type="text"
                  value={localPeriodo}
                  onChange={(e) => setLocalPeriodo(e.target.value)}
                  placeholder="Ej: Primer semestre 2026"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#F8F9FA] placeholder:text-white/30 focus:outline-none focus:border-[#8B5CF6] transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleStep1Continue}
              disabled={!localAsignatura || !localCurso}
              className="w-full bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all"
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
              <h3 className="text-lg font-semibold text-[#F8F9FA] mb-1">
                Selecciona hasta 3 experiencias
              </h3>
              <p className="text-sm text-white/50">
                Estas clases se incluiran en la Tarea 1 de tu portafolio
              </p>
            </div>

            {data.loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-sm text-white/50">
                  Cargando clases...
                </span>
              </div>
            ) : data.classes.length === 0 ? (
              <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-white/50 text-sm">
                  No se encontraron clases para esta asignatura y curso.
                </p>
                <p className="text-white/30 text-xs mt-1">
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

            <p className="text-xs text-white/30 text-center">
              {wizardState.selectedClasses.length}/3 seleccionadas
            </p>

            <div className="flex gap-3">
              <button
                onClick={prevStep}
                className="flex-1 border border-white/10 hover:bg-white/5 text-[#F8F9FA] font-medium py-3 px-6 rounded-xl transition-all"
              >
                Volver
              </button>
              <button
                onClick={nextStep}
                disabled={!canContinueStep2}
                className="flex-1 bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Seleccionar evaluacion + generar */}
        {wizardState.step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-[#F8F9FA] mb-1">
                Selecciona una evaluacion
              </h3>
              <p className="text-sm text-white/50">
                Se usara para la Tarea 2 (monitoreo). Si tiene datos OMR se
                incluiran automaticamente.
              </p>
            </div>

            {data.loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-sm text-white/50">
                  Cargando evaluaciones...
                </span>
              </div>
            ) : data.evaluations.length === 0 ? (
              <div className="text-center py-8 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-white/50 text-sm">
                  No se encontraron evaluaciones activas.
                </p>
                <p className="text-white/30 text-xs mt-1">
                  Puedes continuar sin evaluacion — la Tarea 2 tendra solo
                  plantilla.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.evaluations.map((ev) => (
                  <EvaluationCard
                    key={ev.id}
                    evaluation={ev}
                    selected={wizardState.selectedEvaluation === ev.id}
                    onSelect={() =>
                      setSelectedEvaluation(
                        wizardState.selectedEvaluation === ev.id
                          ? null
                          : ev.id
                      )
                    }
                    hasOMR={
                      wizardState.selectedEvaluation === ev.id &&
                      data.hasOMR
                    }
                  />
                ))}
              </div>
            )}

            {data.hasOMR && wizardState.selectedEvaluation && (
              <div className="flex items-center gap-2 bg-[#06B6D4]/10 border border-[#06B6D4]/20 rounded-xl px-4 py-3">
                <svg
                  className="w-4 h-4 text-[#06B6D4] flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-xs text-[#06B6D4]">
                  Datos OMR detectados — se incluiran resultados en el
                  borrador T2
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={prevStep}
                className="flex-1 border border-white/10 hover:bg-white/5 text-[#F8F9FA] font-medium py-3 px-6 rounded-xl transition-all"
              >
                Volver
              </button>
              <button
                onClick={handleGenerateDrafts}
                disabled={!canGenerate}
                className="flex-1 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all"
              >
                Generar Borradores
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
